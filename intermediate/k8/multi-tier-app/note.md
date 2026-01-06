## Application Resources Overview

This note explains **each Kubernetes resource used in this app** – what it is, **why** you use it, and **how** you use it in this repo.

We'll walk top‑down through the stack:

1. Namespace & configuration (ConfigMap, Secret)  
2. Data layer (PostgreSQL, Redis, PV/PVC)  
3. Application layer (Deployments, StatefulSet, Services)  
4. Platform/cluster layer (RBAC, NetworkPolicy, ResourceQuota, DaemonSet)  
5. Operations layer (Job, CronJob, PodDisruptionBudget)

---

## Kustomize (`kustomization.yaml`)

### What
- `kustomize` lets you define **a reusable base** of manifests and then layer **environment‑specific overlays** on top without copying files.

### Why
- Keeps a single source of truth (`k8s/base`) for:
  - app deployments,
  - databases, cache,
  - infra (RBAC, logging, quotas, network policies),
  - PDBs, jobs, cronjobs.
- Lets you customize per environment (`dev`, `prod`, etc.) in a clean, Git‑friendly way.

### How (in this repo)

- **Base**:
  - File: `k8s/base/kustomization.yaml`
  - Lists all shared resources:
    - namespace, config, secrets
    - backend/frontend/postgres/redis
    - PV/PVC, jobs, cronjobs
    - RBAC, logging, quotas, network policies, PDBs
  - Apply directly:
    ```bash
    kubectl apply -k k8s/base
    ```

- **Dev overlay**:
  - File: `k8s/overlays/dev/kustomization.yaml`
  - Currently:
    - references `../../base`
    - adds `namePrefix: dev-` so all names are prefixed (e.g., `dev-backend`).
  - Apply:
    ```bash
    kubectl apply -k k8s/overlays/dev
    ```

- **Prod overlay**:
  - File: `k8s/overlays/prod/kustomization.yaml`
  - Similar to dev, but with `namePrefix: prod-`.
  - You would typically add patches here for:
    - higher replica counts,
    - stricter resource limits,
    - different config values/URLs.
  - Apply:
    ```bash
    kubectl apply -k k8s/overlays/prod
    ```

- **Preview rendered YAML (no apply)**:
  ```bash
  kubectl kustomize k8s/overlays/dev | less
  ```

This pattern – **`base` + `overlays`** – matches common industry practice for managing multiple environments from a single Kubernetes codebase.

---

## Namespace (`namespace.yaml`)

### What
- Logical "folder" in the cluster: groups all resources for the task app.

### Why
- Isolates this app from other workloads.
- Lets you apply **quotas**, **RBAC**, and **network policies** per environment.

### How (in this repo)
- File: `k8s/base/namespaces/namespace.yaml`
- Creates a `task-app` namespace with labels like `environment: development`.
- Most manifests set `namespace: task-app` so everything lands in the same logical space.

---

## ConfigMap (`configmap.yaml`)

### What
- Key/value store for **non‑secret** configuration (URLs, ports, feature flags).

### Why
- Keeps config **out of images** – you can change config without rebuilding.
- Lets you switch between environments (dev/prod) using overlays.

### How (in this repo)
- File: `k8s/base/config/configmap.yaml`
- Holds values such as:
  - `DB_HOST`, `DB_PORT`, `DB_NAME`
  - `REDIS_HOST`, `REDIS_PORT`
  - `REACT_APP_API_URL`
- Injected into pods via `env` / `envFrom` in the backend and postgres deployments.

---

## Secret (`secrets.yaml`)

### What
- Stores **sensitive** data: passwords, tokens, keys.

### Why
- Avoids hard‑coding secrets in images or plaintext manifests.
- Works seamlessly with containers via env vars or mounted files.

### How (in this repo)
- File: `k8s/base/config/secrets.yaml`
- Contains:
  - `DB_USER`, `DB_PASSWORD`
  - `REDIS_PASSWORD`
  - `JWT_SECRET`
- Used by:
  - Postgres container (`POSTGRES_USER`, `POSTGRES_PASSWORD`)
  - Backend API (`DB_USER`, `DB_PASSWORD`, `JWT_SECRET`)
  - Jobs/CronJobs (migration, backup) via environment variables.

---

## PersistentVolume & PersistentVolumeClaim (Postgres + Backups)

### What
- **PersistentVolume (PV)**: actual disk in the cluster.
- **PersistentVolumeClaim (PVC)**: request for storage from a pod.

### Why
- Databases and backups must **survive pod restarts** and rescheduling.
- Keeps Postgres and backup data on disk outside the pod lifecycle.

### How (in this repo)
- Files:
  - `k8s/base/databases/postgres/storage/postgres-pv.yaml`
  - `k8s/base/databases/postgres/storage/backup-pvc.yaml`
- Patterns:
  - PV uses `hostPath` on the Kind node for local dev.
  - PVC is bound by `storageClassName: manual`, `ReadWriteOnce`, and size.
  - Postgres Deployment mounts the PVC at `/var/lib/postgresql/data`.
  - CronJob mounts `backup-pvc` at `/backups` for dump files.

---

## Deployments (Backend, Frontend, Postgres)

### What
- Controller that manages **stateless or semi‑stateful** workloads:
  - keeps a desired number of pods running,
  - supports rolling updates and rollbacks.

### Why
- Ensures the app is always running with the right **replica count**.
- Gives you safe, zero‑downtime style updates for API and frontend.

### How (in this repo)
- Files:
  - `k8s/base/apps/backend/deployment.yaml`
  - `k8s/base/apps/frontend/deployment.yaml`
  - `k8s/base/databases/postgres/deployment.yaml`
- Key ideas:
  - Backend: 3 replicas, probes (`/health`, `/ready`), resource requests/limits.
  - Frontend: Nginx serving React, exposed via a NodePort service.
  - Postgres: 1 replica, PVC volume mount, `pg_isready` probes for health.

---

## StatefulSet (Redis)

### What
- Like a Deployment, but with **stable identities and storage** per pod:
  - Pods named `redis-0`, `redis-1`, ...
  - Each pod gets its own PVC.

### Why
- For Redis in clustered/replicated mode you often need:
  - predictable hostnames (for internal clustering),
  - persistent storage per instance.

### How (in this repo)
- File: `k8s/base/cache/redis/statefulset.yaml`
- Provides:
  - ordered startup/termination,
  - dedicated PVC per Redis pod,
  - stable DNS names like `redis-0.redis-headless.task-app.svc.cluster.local`.

---

## Services (ClusterIP & NodePort)

### What
- Stable virtual IP and DNS name in front of a set of pods.

Types you use:
- **ClusterIP** – internal‑only (backend, postgres, redis).
- **NodePort** – exposed on a node port for local access (frontend, backend).

### Why
- Pods are ephemeral – IPs change on every restart.
- Services give:
  - stable addresses for other services,
  - built‑in load balancing across replicas.

### How (in this repo)
- Defined inside your deployment YAMLs or separate service manifests.
- Examples (from README and manifests):
  - `backend-service` (ClusterIP or NodePort) → routes to backend pods.
  - `postgres-service` (ClusterIP) → used via `DB_HOST` in ConfigMap.
  - `redis-service` (ClusterIP) → used by backend as cache endpoint.
  - `frontend-service` (NodePort 30080) → `http://localhost:30080`.

---

## RBAC (Roles, RoleBindings, ClusterRoles)

### What
- **RBAC** (Role‑Based Access Control) defines who can do what in the cluster.
- `Role`/`RoleBinding` are namespace‑scoped; `ClusterRole`/`ClusterRoleBinding` are cluster‑wide.

### Why
- Principle of least privilege:
  - apps only get the permissions they need,
  - logging/monitoring agents can read metadata but not change workloads.

### How (in this repo)
- Files:
  - `k8s/base/infra/rbac/rbac.yaml`
  - `k8s/base/infra/logging/fluentd-rbac.yaml`
- Examples:
  - Fluentd `ServiceAccount` + `ClusterRole` + `ClusterRoleBinding` so it can list/watch pods and namespaces for log enrichment.
  - App/service accounts can be restricted per namespace.

---

## Network Policies (`network-policies.yaml`)

### What
- Firewall rules **inside** the cluster:
  - control which pods can talk to which other pods/ports.

### Why
- Default Kubernetes networking is "allow all".
- NetworkPolicies let you:
  - isolate databases from the internet,
  - permit only backend → database, frontend → backend, etc.

### How (in this repo)
- File: `k8s/base/infra/network/network-policies.yaml`
- Typical patterns:
  - allow frontend → backend HTTP only,
  - allow backend → postgres/redis only on DB/cache ports,
  - deny everything else by default for sensitive components.

---

## ResourceQuota & Limits (`resource-quota.yaml`)

### What
- **ResourceQuota**: caps total CPU/memory/objects per namespace.
- **LimitRange** (if used): default/min/max per pod/container.

### Why
- Prevents a single namespace from consuming the whole cluster.
- Encourages each team/app to define **requests/limits** properly.

### How (in this repo)
- File: `k8s/base/infra/quotas/resource-quota.yaml`
- Combined with:
  - `resources.requests` / `resources.limits` in Deployments.
  - Ensures the `task-app` namespace stays within a safe budget.

---

## DaemonSets

### Concept

Ensures a copy of a pod runs on every node (or selected nodes)

Think of it like:
- You have 10 houses (nodes)
- You want a smoke detector (pod) in every house
- DaemonSet ensures this automatically
- Add a new house? DaemonSet adds a smoke detector
- Remove a house? DaemonSet cleans up

### Common Use Cases
1. Log Collection: Fluentd, Logstash on every node
2. Monitoring: Node exporters, monitoring agents
3. Network: CNI plugins, kube-proxy
4. Storage: GlusterFS, Ceph daemons

### Example: Log Collector
Let's deploy Fluentd to collect logs from all nodes

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: fluentd
  namespace: task-app
  labels:
    app: fluentd
spec:
  selector:
    matchLabels:
      app: fluentd
  template:
    metadata:
      labels:
        app: fluentd
    spec:
      serviceAccount: fluentd
      # Run on all nodes (or use nodeSelector to filter)
      tolerations:
      # Allow running on control-plane (optional)
      - key: node-role.kubernetes.io/control-plane
        effect: NoSchedule

      containers:
      - name: fluentd
        image: fluent/fluentd-kubernetes-daemonset:v1-debian-elasticsearch
        env:
        # Configure output (we'll just log for now)
        - name: FLUENT_ELASTICSEARCH_HOST
          value: "elasticsearch.logging.svc.cluster.local"
        - name: FLUENT_ELASTICSEARCH_PORT
          value: "9200"

        resources:
          requests:
            memory: "200Mi"
            cpu: "100m"
          limits:
            memory: "400Mi"
            cpu: "200m"

        volumeMounts:
        # Mount node's log directory
        - name: varlog
          mountPath: /var/log
        # Mount container logs
        - name: varlibdockercontainers
          mountPath: /var/lib/docker/containers
          readOnly: true

      volumes:
      # Node's log directory
      - name: varlog
        hostPath:
          path: /var/log
      # Container log directory
      - name: varlibdockercontainers
        hostPath:
          path: /var/lib/docker/containers
```

Add Service account, RBAC ClusterRole and ClusterRoleBinding
- **ServiceAccount** fluentd in task-app
- **ClusterRole** fluentd-metadata-reader (verbs: get/list/watch on pods and namespaces)
- **ClusterRoleBinding** fluentd-metadata-reader-binding that binds the ClusterRole to task-app:fluentd

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: fluentd
  namespace: task-app

---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: fluentd-metadata-reader
rules:
  - apiGroups: [""]
    resources: ["pods", "namespaces"]
    verbs: ["get", "list", "watch"]

---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: fluentd-metadata-reader-binding
subjects:
  - kind: ServiceAccount
    name: fluentd
    namespace: task-app
roleRef:
  kind: ClusterRole
  name: fluentd-metadata-reader
  apiGroup: rbac.authorization.k8s.io

```


## Understanding the configuration:

### tolerations

```yaml
tolerations:
- key: ...
  effect: NoSchedule
```

- Nodes can have "taints" that repel pods
- Control-plane nodes are usually tainted (don't run user workloads)
- toleration = "I can tolerate this taint, let me run here"

#### Think of it like:

- Taint = "No swimming" sign on a pool
- Toleration = Lifeguard badge (you're allowed despite the sign)

### hostPath volumes
```yaml
volumes:
- name: varlog
  hostPath:
    path: /var/log # Node's filesystem
```

#### What is hostPath?

Mounts a directory from the node's filesystem into the pod
- Tied to specific node
- Security risk (pod can access node files)
- Use only when necessary (like log collection)

### Why a ClusterRole/ClusterRoleBinding?

The metadata plugin needs to list/watch pods across the cluster (cluster-scope). That requires a cluster-scoped role (ClusterRole) bound to the service account. If you only need namespace-scoped access, you can change to a Role + RoleBinding scoped to a namespace, but the plugin typically accesses cluster endpoints.

## Run commands

```yaml

# Deploy
kubectl apply -f k8s/base/fluentd-rbac.yaml
kubectl apply -f k8s/base/fluentd-daemonset.yaml

# Check binding

kubectl get clusterrole fluentd-metadata-reader
kubectl get clusterrolebinding fluentd-metadata-reader-binding

# Check - you'll see ONE pod per node!
kubectl get daemonset fluentd -n task-app
kubectl get pods -l app=fluentd -o wide -n task-app

# You should see:
# fluentd-xxxxx   1/1   Running   bootcamp-control-plane
# fluentd-yyyyy   1/1   Running   bootcamp-worker
# fluentd-zzzzz   1/1   Running   bootcamp-worker2
# fluentd-wwwww   1/1   Running   bootcamp-worker3

# Check logs
kubectl logs -l app=fluentd --tail=20 -n task-app
```

## Jobs (One-time Tasks)

### Concept

Runs a task to completion, the stops

#### Think of it like
- Deployment = Restaurant (always open)
- Job = Catering service (one event, then done)

### Use Cases

1. Data migration: Import data once
2. Batch processing: Process a file
3. Database initialization: Create tables, seed data
4. Cleanup tasks: Delete old files

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: db-migration
  namespace: task-app
spec:
  # Job completion settings
  completions: 1  # Run once successfully
  parallelism: 1  # One pod at a time
  backoffLimit: 3  # Retry up to 3 times if fails

  template:
    metadata:
      labels:
        app: db-migration
    spec:
      restartPolicy: Never  # Don't restart on failure (Job handles retries)

      containers:
      - name: migration
        image: postgres:15-alpine
        command:
        - /bin/sh
        - -c
        - |
          echo "Starting database migration..."

          # Wait for database to be ready
          until pg_isready -h $DB_HOST -U $DB_USER; do
            echo "⏳ Waiting for database..."
            sleep 2
          done

          echo "Database is ready!"

          # Run migration
          psql -h $DB_HOST -U $DB_USER -d $DB_NAME <<EOF

          -- Create additional tables
          CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(255) UNIQUE NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS task_comments (
            id SERIAL PRIMARY KEY,
            task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
            comment TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          -- Create indexes
          CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
          CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
          CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);

          -- Insert sample data
          INSERT INTO users (username, email) VALUES
            ('admin', 'admin@example.com'),
            ('user1', 'user1@example.com')
          ON CONFLICT (username) DO NOTHING;

          EOF

          echo " Migration completed successfully!"

        env:
        - name: DB_HOST
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: DB_HOST
        - name: DB_USER
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: DB_USER
        - name: PGPASSWORD  # PostgreSQL reads this automatically
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: DB_PASSWORD
        - name: DB_NAME
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: DB_NAME

```

**restartPolicy**
```yaml
restartPolicy: Never  # or OnFailure
```
- **Never**: Create new pod on failure (Job handles retries)
- **OnFailure**: Restart same pod on failure
- **Always**: NOT ALLOWED in Jobs

```yaml
# Deploy job
kubectl apply -f k8s/base/db-migration-job.yaml

# Watch job progress
kubectl get jobs -n task-app -w

# Check job status
kubectl describe job db-migration -n task-app

# View logs
kubectl logs job/db-migration -n task-app

# Check if migration succeeded
kubectl get job db-migration -n task-app
# Should show: COMPLETIONS: 1/1

# Verify in database
kubectl exec -it deployment/postgres -n task-app -- psql -U postgres -d taskDB -c "\dt"
# Should see new tables: users, tasks, task_comments

# Delete job (keeps logs for a while)
kubectl delete job db-migration -n task-app

# Or set TTL in job spec (auto-cleanup)
spec:
  ttlSecondsAfterFinished: 3600  # Delete 1 hour after completion
```

## CronJob (Scheduled Tasks)

### Concept

Runs Jobs on a schedule (like cron in Linux)

**Think of it like:**
- Job = "Do this task once"
- CronJob = "Do this task every day at 2 AM"

### Use Cases

1. **Database backups**: Daily at 2 AM
2. **Report generation**: Weekly on Sundays
3. **Cleanup tasks**: Delete old files hourly
4. **Health checks**: Ping services every 5 minutes
5. **Data synchronization**: Sync with external API every hour

### Cron Schedule Format
```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 6) (Sunday=0)
│ │ │ │ │
* * * * *
```

**Examples:**
```
"*/5 * * * *"       # Every 5 minutes
"0 * * * *"         # Every hour
"0 2 * * *"         # Every day at 2 AM
"0 0 * * 0"         # Every Sunday at midnight
"0 0 1 * *"         # First day of every month
"30 3 * * 1-5"      # 3:30 AM Monday-Friday
"0 */4 * * *"       # Every 4 hours
"@hourly"           # Shorthand for "0 * * * *"
"@daily"            # Shorthand for "0 0 * * *"
"@weekly"           # Shorthand for "0 0 * * 0"
```

## Example: Database Backup CronJob

**Create k8s/base/backup-cronjob.yaml:**
```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: postgres-backup
  namespace: task-app
spec:
  # Schedule: Every day at 2 AM
  schedule: "0 2 * * *"

  # How many successful job histories to keep
  successfulJobsHistoryLimit: 3

  # How many failed job histories to keep
  failedJobsHistoryLimit: 1

  # Concurrency policy
  concurrencyPolicy: Forbid  # Don't start new if previous still running

  # Starting deadline (skip if missed by more than this)
  startingDeadlineSeconds: 300  # 5 minutes

  jobTemplate:
    spec:
      backoffLimit: 2
      template:
        metadata:
          labels:
            app: postgres-backup
        spec:
          restartPolicy: OnFailure

          containers:
          - name: backup
            image: postgres:15-alpine
            command:
            - /bin/sh
            - -c
            - |
              echo " Starting PostgreSQL backup..."

              # Create backup filename with timestamp
              BACKUP_FILE="/backups/postgres-backup-$(date +%Y%m%d-%H%M%S).sql"

              echo " Backing up to: $BACKUP_FILE"

              # Perform backup
              pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > $BACKUP_FILE

              if [ $? -eq 0 ]; then
                echo " Backup completed successfully!"
                echo " Backup size: $(du -h $BACKUP_FILE | cut -f1)"

                # Keep only last 7 backups
                echo "Cleaning up old backups..."
                ls -t /backups/postgres-backup-*.sql | tail -n +8 | xargs -r rm

                echo " Current backups:"
                ls -lh /backups/
              else
                echo " Backup failed!"
                exit 1
              fi

            env:
            - name: DB_HOST
              valueFrom:
                configMapKeyRef:
                  name: app-config
                  key: DB_HOST
            - name: DB_USER
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: DB_USER
            - name: PGPASSWORD
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: DB_PASSWORD
            - name: DB_NAME
              valueFrom:
                configMapKeyRef:
                  name: app-config
                  key: DB_NAME

            volumeMounts:
            - name: backup-storage
              mountPath: /backups

          volumes:
          - name: backup-storage
            persistentVolumeClaim:
              claimName: backup-pvc

```

**Create PVC for backups:**

Create k8s/base/backup-pvc.yaml:
```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: backup-pv
spec:
  storageClassName: manual
  capacity:
    storage: 10Gi
  accessModes:
    - ReadWriteOnce
  hostPath:
    path: "/mnt/data/backups"
  persistentVolumeReclaimPolicy: Retain

---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: backup-pvc
  namespace: task-app
spec:
  storageClassName: manual
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi

```

**Deploy CronJob:**

```bash
# Create PVC first
kubectl apply -f k8s/base/backup-pvc.yaml

# Deploy CronJob
kubectl apply -f k8s/base/backup-cronjob.yaml

# View CronJob
kubectl get cronjobs -n task-app

# Should show:
# NAME              SCHEDULE    SUSPEND   ACTIVE   LAST SCHEDULE   AGE
# postgres-backup   0 2 * * *   False     0        <none>          10s

# Trigger manually for testing (don't wait for 2 AM!)
kubectl create job --from=cronjob/postgres-backup manual-backup-1 -n task-app

# Watch job run
kubectl get jobs -n task-app -w

# View logs
kubectl logs job/manual-backup-1 -n task-app

# Check if backup file was created
kubectl exec -it deployment/postgres -n task-app -- ls -lh /var/lib/postgresql/backups/
```

### Understanding CronJob Spec:
**concurrencyPolicy**

```yaml
concurrencyPolicy: Forbid  # or Allow, or Replace
```

- **Forbid**: Skip new run if previous still running
- **Allow**: Allow concurrent runs
- **Replace**: Cancel previous run, start new one

**Example scenario:**
```
2:00 AM - Backup starts (takes 10 minutes)
2:05 AM - Another schedule hits

Forbid:  Skip 2:05 run, wait for next schedule
Allow:   Start another backup in parallel
Replace: Kill 2:00 backup, start fresh at 2:05
startingDeadlineSeconds
```

```yaml
startingDeadlineSeconds: 300  # 5 minutes
```

**What if CronJob misses schedule?**
- Cluster was down
- Too many jobs running
- Controller was restarting

**With deadline:**
```
Scheduled: 2:00 AM
Actual start: 2:06 AM (6 minutes late)
Deadline: 5 minutes
Result: SKIPPED (too late)
```


## Part 9: Pod Disruption Budgets (PDB)
**Concept**
Pod Disruption Budget: Limits how many pods can be unavailable during voluntary disruptions.

**Think of it like:**

- You have 5 workers
- PDB says: "Always keep at least 3 working"
- When upgrading, Kubernetes won't take down too many at once

### Types of Disruptions
**Voluntary Disruptions (PDB applies)**

- Node drain (kubectl drain)
- Cluster upgrades
- Node maintenance
- Manual pod deletion (kubectl delete)

**Involuntary Disruptions (PDB doesn't apply)**

- Hardware failure
- Kernel panic
- Network partition
- Pod killed by OOM

### PDB Specifications
You can specify disruption budget in two ways:
1. **minAvailable**
"Always keep at least N pods running"

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: backend-pdb
spec:
  minAvailable: 2  # Keep at least 2 pods running
  selector:
    matchLabels:
      app: backend
```
2. **maxUnavailable**
"At most N pods can be down"

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: backend-pdb
spec:
  maxUnavailable: 1  # At most 1 pod can be down
  selector:
    matchLabels:
      app: backend
Example: Backend PDB
Create k8s/base/backend-pdb.yaml:
yamlapiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: backend-pdb
  namespace: task-app
spec:
  minAvailable: 2  # Always keep at least 2 backend pods running
  selector:
    matchLabels:
      app: backend
```

**What this means:**
```
Backend has 3 replicas:
├─ backend-abc
├─ backend-def
└─ backend-ghi

PDB says: minAvailable: 2

During node drain:
1. Drain can evict backend-abc ✅ (2 pods still available)
2. Drain tries to evict backend-def ❌ (would leave only 1 pod)
3. Drain waits until new pod is ready
4. New pod backend-xyz becomes ready
5. Now drain can evict backend-def ✅ (2 pods still available)
```
Deploy PDB:
```bash
# Create PDB
kubectl apply -f k8s/base/backend-pdb.yaml

# View PDB
kubectl get pdb -n task-app

# Describe PDB (see current status)
kubectl describe pdb backend-pdb -n task-app

# Output shows:
# Min available: 2
# Current: 3
# Allowed disruptions: 1  (can safely disrupt 1 pod)
Test PDB (simulate node drain):
bash# Check current pods
kubectl get pods -l app=backend -o wide

# Try to drain a node (simulated - won't actually drain in Kind)
# This would normally be: kubectl drain <node-name> --ignore-daemonsets

# Instead, let's manually test by deleting pods rapidly
kubectl delete pod -l app=backend --force --grace-period=0

# Notice:
# - Pods are deleted
# - New pods created
# - But never less than 2 running simultaneously
# - PDB ensures minimum availability

# Check PDB events
kubectl describe pdb backend-pdb -n task-app
```
**PDB with Percentages**

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: backend-pdb
spec:
  minAvailable: 66%  # Keep at least 66% running
  selector:
    matchLabels:
      app: backend
```

**Examples:**
```
3 replicas, minAvailable: 66%
→ minAvailable = ceil(3 * 0.66) = 2 pods

10 replicas, minAvailable: 80%
→ minAvailable = ceil(10 * 0.80) = 8 pods

5 replicas, maxUnavailable: 20%
→ maxUnavailable = floor(5 * 0.20) = 1 pod
```
**Production PDBs**
Create k8s/base/all-pdbs.yaml:
```yaml
# Backend PDB
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: backend-pdb
  namespace: task-app
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: backend

---
# Frontend PDB
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: frontend-pdb
  namespace: task-app
spec:
  minAvailable: 1  # Keep at least 1 frontend running
  selector:
    matchLabels:
      app: frontend

---
# Redis PDB (StatefulSet)
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: redis-pdb
  namespace: task-app
spec:
  minAvailable: 2  # Keep at least 2 Redis instances
  selector:
    matchLabels:
      app: redis

```

```bash
kubectl apply -f k8s/base/all-pdbs.yaml
kubectl get pdb -n task-app
```

**In Lens:**
- Workloads → Pod Disruption Budgets
- See all PDBs and their status
- Check "Allowed Disruptions" column

---
