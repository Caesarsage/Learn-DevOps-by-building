# Kubernetes Architecture & Core Concepts
## Complete Documentation & Reference Guide

---

![K8s Lens](./public/assets/image-1.png)


## Table of Contents

1. [Overview](#overview)
2. [Architecture Deep Dive](#architecture-deep-dive)
3. [Environment Setup](#environment-setup)
4. [Core Kubernetes Resources](#core-kubernetes-resources)
5. [Application Deployment](#application-deployment)
6. [Operations Guide](#operations-guide)
7. [Adding PV and PVC](#pv-pvc)
8. [Troubleshooting](#troubleshooting)
9. [Quick Reference](#quick-reference)
10. [Key Learnings](#key-learnings)

---

## Overview

![task manager](./public/assets/image.png)

### What You Built

A complete three-tier task management application running on Kubernetes:

- **Frontend**: React application (2 replicas)
- **Backend**: Node.js REST API (3 replicas)
- **Database**: PostgreSQL (1 replica)
- **Cache**: Redis (1 replica)

### Technologies Used

- **Kubernetes**: v1.32.2 (via Kind)
- **Container Runtime**: containerd
- **Frontend**: React 18, Nginx
- **Backend**: Node.js 18, Express.js
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Tools**: kubectl, Lens IDE, Docker

### Access Points

- **Frontend UI**: http://localhost:30080
- **Backend API**: http://localhost:30081
- **Health Check**: http://localhost:30081/health
- **API Docs**: http://localhost:30081/api/tasks

---

## Architecture Deep Dive

### Kubernetes Control Plane Components

#### 1. API Server (kube-apiserver)
- **Purpose**: Central management point for all cluster operations
- **Function**:
  - Validates and processes all REST requests
  - Updates etcd with cluster state
  - Only component that talks to etcd directly
- **Interaction**: All kubectl commands go through the API server

#### 2. etcd
- **Purpose**: Distributed key-value store for cluster data
- **Function**:
  - Stores all cluster configuration and state
  - Source of truth for desired state
  - Enables cluster recovery
- **Critical**: If etcd fails, cluster loses memory

#### 3. Scheduler (kube-scheduler)
- **Purpose**: Assigns pods to nodes
- **Function**:
  - Watches for new pods without assigned nodes
  - Considers resources (CPU, memory)
  - Evaluates constraints (affinity, taints, tolerations)
  - Makes optimal placement decisions

#### 4. Controller Manager (kube-controller-manager)
- **Purpose**: Runs control loops that regulate cluster state
- **Controllers**:
  - **Node Controller**: Monitors node health
  - **Replication Controller**: Maintains correct pod count
  - **Endpoints Controller**: Populates service endpoints
  - **Service Account Controller**: Creates default accounts
- **Function**: Continuously reconciles actual state with desired state

### Worker Node Components

#### 1. kubelet
- **Purpose**: Primary node agent
- **Function**:
  - Ensures containers described in PodSpecs are running
  - Reports node and pod status to API server
  - Manages pod lifecycle (create, start, stop, restart)
  - Executes health checks (liveness, readiness)

#### 2. kube-proxy
- **Purpose**: Network proxy on each node
- **Function**:
  - Maintains network rules for pod communication
  - Implements Services abstraction
  - Routes traffic to appropriate pods
  - Can use iptables, IPVS, or userspace modes

#### 3. Container Runtime
- **Purpose**: Runs containers
- **Options**: Docker, containerd, CRI-O
- **Function**:
  - Pulls container images
  - Starts and stops containers
  - Manages container lifecycle

### Request Flow Example

```
User runs: kubectl apply -f deployment.yaml

1. kubectl → API Server (validates request)
2. API Server → etcd (stores desired state)
3. Controller Manager → detects new deployment
4. Controller Manager → creates ReplicaSet
5. ReplicaSet Controller → creates Pod specs
6. Scheduler → assigns Pods to nodes
7. kubelet (on node) → pulls image & starts container
8. kube-proxy → configures networking
9. Controller Manager → monitors and reconciles
```

---

## Environment Setup

### Prerequisites Installed

```bash
# Docker
docker --version
# Docker version 24.0.0+

# kubectl
kubectl version --client
# Client Version: v1.27.0+

# Kind
kind version
# kind v0.20.0+

# Lens IDE
# Downloaded from https://k8slens.dev/
```

### Kind Cluster Configuration

**File**: `kind-cluster-config.yaml`

```yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
name: bootcamp
nodes:
  - role: control-plane
    extraPortMappings:
    - containerPort: 30080  # Frontend
      hostPort: 30080
      protocol: TCP
    - containerPort: 30081  # Backend API
      hostPort: 30081
      protocol: TCP
  - role: worker
  - role: worker
  - role: worker
```

**Key Configuration**:
- 1 control-plane node
- 3 worker nodes
- Port mappings for local access (30080, 30081)

### Cluster Creation Commands

```bash
# Delete existing cluster (if any)
kind delete cluster --name bootcamp

# Create new cluster
kind create cluster --config kind-cluster-config.yaml

# Verify cluster
kubectl cluster-info --context kind-bootcamp
kubectl get nodes

# Set default namespace
kubectl config set-context --current --namespace=task-app
```

### Project Structure

This repo is structured like a real-world app with separate app code and Kubernetes manifests:

```
k8-multi-tier-app/
├── kind-cluster-config.yaml
├── app/
│   ├── backend/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── server.js
│   └── frontend/
│       ├── Dockerfile
│       ├── nginx.conf
│       ├── package.json
│       ├── public/
│       │   └── index.html
│       └── src/
│           ├── index.js
│           ├── index.css
│           ├── App.js
│           └── App.css
└── k8s/
    ├── base/                # Environment-agnostic "golden" manifests
    │   ├── kustomization.yaml
    │   ├── namespaces/
    │   │   └── namespace.yaml
    │   ├── config/
    │   │   ├── configmap.yaml
    │   │   └── secrets.yaml
    │   ├── apps/
    │   │   ├── backend/
    │   │   │   ├── deployment.yaml
    │   │   │   └── pdb.yaml
    │   │   └── frontend/
    │   │       └── deployment.yaml
    │   ├── databases/
    │   │   └── postgres/
    │   │       ├── deployment.yaml
    │   │       ├── storage/
    │   │       │   ├── postgres-pv.yaml
    │   │       │   └── backup-pvc.yaml
    │   │       ├── backup/
    │   │       │   └── backup-cronjob.yaml
    │   │       └── migrations/
    │   │           └── db-migration-job.yaml
    │   ├── cache/
    │   │   └── redis/
    │   │       ├── deployment.yaml
    │   │       └── statefulset.yaml
    │   ├── infra/
    │   │   ├── logging/
    │   │   │   ├── fluentd-daemonset.yaml
    │   │   │   └── fluentd-rbac.yaml
    │   │   ├── network/
    │   │   │   └── network-policies.yaml
    │   │   ├── rbac/
    │   │   │   └── rbac.yaml
    │   │   └── quotas/
    │   │       └── resource-quota.yaml
    │   └── pdbs/
    │       └── all-pdbs.yaml
    └── overlays/            # Environment-specific overlays
        ├── dev/
        │   └── kustomization.yaml
        └── prod/
            └── kustomization.yaml
```

### End-to-End Flow: From Code to Running App

This section ties everything together so you can see the complete flow.

#### 1. Build and load container images into Kind

```bash
# Backend
cd app/backend
docker build -t task-backend:v1 .
kind load docker-image task-backend:v1 --name bootcamp

# Frontend
cd ../frontend
docker build -t task-frontend:v1 .
kind load docker-image task-frontend:v1 --name bootcamp
```

#### 2. Apply Kubernetes manifests (using kustomize)

You now have a **base** and **overlays** that follow industry-standard kustomize structure.

- **Apply the shared base only** (no env-specific customizations):

```bash
kubectl apply -k k8s/base
```

- **Apply the dev overlay** (recommended for local dev):

```bash
kubectl apply -k k8s/overlays/dev
```

- **Apply the prod overlay** (example for a prod-like config):

```bash
kubectl apply -k k8s/overlays/prod
```

You can also preview what kustomize will generate:

```bash
kubectl kustomize k8s/overlays/dev | less
```

#### 3. What gets created (logical flow)

- **Namespace & config**
  - `k8s/base/namespaces/namespace.yaml` → creates the `task-app` namespace.
  - `k8s/base/config/configmap.yaml` → non-sensitive app configuration.
  - `k8s/base/config/secrets.yaml` → database, Redis, JWT secrets.

- **Data layer**
  - `k8s/base/databases/postgres/storage/postgres-pv.yaml` & `backup-pvc.yaml` → persistent storage.
  - `k8s/base/databases/postgres/deployment.yaml` → PostgreSQL pod.
  - `k8s/base/cache/redis/*` → Redis deployment/statefulset.

- **Application layer**
  - `k8s/base/apps/backend/*` → Node.js API deployment + PDB.
  - `k8s/base/apps/frontend/deployment.yaml` → React+Nginx frontend.

- **Platform/cluster services**
  - `k8s/base/infra/*` → logging (Fluentd), network policies, RBAC, resource quotas.
  - `k8s/base/pdbs/all-pdbs.yaml` → consolidated PodDisruptionBudgets.

The **overlay** directories (`k8s/overlays/dev` and `k8s/overlays/prod`) are where you would add patches for:

- replica counts per environment
- different resource requests/limits
- environment-specific config/secrets or hostnames

so that the **base** stays clean and reusable.

---

## Core Kubernetes Resources

### 1. Namespace

**Purpose**: Logical isolation and organization

**File**: `k8s/base/namespace.yaml`

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: task-app
  labels:
    name: task-app
    environment: development
```

**Commands**:
```bash
# Create
kubectl apply -f k8s/base/namespace.yaml

# List all namespaces
kubectl get namespaces

# Set as default
kubectl config set-context --current --namespace=task-app

# View resources in namespace
kubectl get all -n task-app
```

**Use Cases**:
- Environment separation (dev, staging, prod)
- Team/project isolation
- Resource quotas per namespace
- RBAC policies per namespace

---

### 2. ConfigMap

**Purpose**: Store non-sensitive configuration data

**File**: `k8s/base/configmap.yaml`

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: task-app
data:
  DB_HOST: "postgres-service"
  DB_PORT: "5432"
  DB_NAME: "taskdb"
  REDIS_HOST: "redis-service"
  REDIS_PORT: "6379"
  NODE_ENV: "development"
  LOG_LEVEL: "info"
  API_PORT: "3000"
  REACT_APP_API_URL: "http://localhost:30081/api"
```

**Usage in Pods**:

```yaml
# Single environment variable
env:
- name: DB_HOST
  valueFrom:
    configMapKeyRef:
      name: app-config
      key: DB_HOST

# All keys as environment variables
envFrom:
- configMapRef:
    name: app-config

# Mount as volume
volumes:
- name: config
  configMap:
    name: app-config
volumeMounts:
- name: config
  mountPath: /etc/config
```

**Commands**:
```bash
# Create from file
kubectl apply -f k8s/base/configmap.yaml

# Create from literal
kubectl create configmap my-config --from-literal=key=value

# Create from file
kubectl create configmap app-config --from-file=config.properties

# View
kubectl get configmap app-config -o yaml
kubectl describe configmap app-config

# Edit
kubectl edit configmap app-config
```

**Best Practices**:
- ✅ Use for non-sensitive configuration
- ✅ Keep environment-specific values separate
- ✅ Version ConfigMaps (app-config-v1, app-config-v2)
- ❌ Don't store secrets (use Secrets instead)
- ❌ Don't store large data (use Volumes)

---

### 3. Secrets

**Purpose**: Store sensitive data (passwords, tokens, keys)

**File**: `k8s/base/secrets.yaml`

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: task-app
type: Opaque
stringData:  # Plain text - Kubernetes encodes
  DB_USER: "postgres"
  DB_PASSWORD: "postgres123"
  REDIS_PASSWORD: "redis123"
  JWT_SECRET: "your-secret-jwt-key"
```

**Usage in Pods**:

```yaml
# Single environment variable
env:
- name: DB_PASSWORD
  valueFrom:
    secretKeyRef:
      name: app-secrets
      key: DB_PASSWORD

# All keys as environment variables
envFrom:
- secretRef:
    name: app-secrets

# Mount as volume (more secure)
volumes:
- name: secrets
  secret:
    secretName: app-secrets
volumeMounts:
- name: secrets
  mountPath: /etc/secrets
  readOnly: true
```

**Commands**:
```bash
# Create from file
kubectl apply -f k8s/base/secrets.yaml

# Create from literal
kubectl create secret generic my-secret --from-literal=password=secret123

# Create from file
kubectl create secret generic db-secret --from-file=./password.txt

# View (values hidden)
kubectl get secret app-secrets
kubectl describe secret app-secrets

# Decode secret value
kubectl get secret app-secrets -o jsonpath='{.data.DB_PASSWORD}' | base64 -d

# Base64 encode manually
echo -n 'mypassword' | base64
```

**Security Notes**:
- ⚠️ Secrets are base64 encoded, NOT encrypted by default
- ⚠️ Use RBAC to restrict access
- ⚠️ Enable encryption at rest in production
- ✅ Consider external secret management (AWS Secrets Manager, Vault)
- ✅ Never commit secrets to Git
- ✅ Use separate secrets per environment

---

### 4. Deployment

**Purpose**: Manage stateless applications with replicas

**Key Features**:
- Maintains desired number of pod replicas
- Rolling updates with zero downtime
- Rollback capability
- Self-healing (recreates failed pods)

**Example**: `k8s/base/backend-deployment.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: task-app
  labels:
    app: backend
    tier: api
spec:
  replicas: 3  # Desired number of pods
  selector:
    matchLabels:
      app: backend  # Must match template labels
  template:
    metadata:
      labels:
        app: backend
        tier: api
    spec:
      containers:
      - name: backend
        image: task-backend:v1
        imagePullPolicy: Never
        ports:
        - containerPort: 3000
          name: http
        env:
        - name: DB_HOST
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: DB_HOST
        resources:
          requests:
            memory: "256Mi"
            cpu: "200m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
```

**Key Components Explained**:

#### replicas
- Number of pod copies to run
- Deployment ensures this number is maintained
- Can be scaled up/down dynamically

#### selector
- Defines how Deployment finds its pods
- Must match pod template labels
- Used for ownership tracking

#### template
- Blueprint for creating pods
- Contains pod specification
- All replicas use this template

#### resources
- **requests**: Minimum guaranteed resources (used by scheduler)
- **limits**: Maximum resources pod can use (enforced by kubelet)

#### probes
- **livenessProbe**: Is container alive? (restart if fails)
- **readinessProbe**: Is container ready for traffic? (remove from service if fails)

**Commands**:
```bash
# Create/update deployment
kubectl apply -f k8s/base/backend-deployment.yaml

# View deployments
kubectl get deployments
kubectl get deploy backend -o wide

# View replica sets (created by deployment)
kubectl get replicasets
kubectl get rs

# View pods
kubectl get pods -l app=backend

# Describe deployment (see events)
kubectl describe deployment backend

# Scale deployment
kubectl scale deployment backend --replicas=5

# Update image (rolling update)
kubectl set image deployment/backend backend=task-backend:v2

# Check rollout status
kubectl rollout status deployment/backend

# View rollout history
kubectl rollout history deployment/backend

# Rollback to previous version
kubectl rollout undo deployment/backend

# Rollback to specific revision
kubectl rollout undo deployment/backend --to-revision=2

# Pause/resume rollout
kubectl rollout pause deployment/backend
kubectl rollout resume deployment/backend

# Delete deployment
kubectl delete deployment backend
```

---

### 5. Service

**Purpose**: Provide stable networking for pods

**Types**:

#### ClusterIP (Default)
- Internal access only
- Stable internal IP address
- Used for inter-service communication

```yaml
apiVersion: v1
kind: Service
metadata:
  name: backend-service
  namespace: task-app
spec:
  type: ClusterIP
  selector:
    app: backend
  ports:
  - port: 3000        # Service port
    targetPort: 3000  # Container port
    protocol: TCP
```

**Access**: `backend-service.task-app.svc.cluster.local:3000`

#### NodePort
- Exposes service on each node's IP
- Port range: 30000-32767
- Used for external access in development

```yaml
apiVersion: v1
kind: Service
metadata:
  name: frontend-service
  namespace: task-app
spec:
  type: NodePort
  selector:
    app: frontend
  ports:
  - port: 80
    targetPort: 80
    nodePort: 30080  # Accessible externally
    protocol: TCP
```

**Access**: `http://localhost:30080` or `http://<node-ip>:30080`

#### LoadBalancer
- Creates cloud provider load balancer
- Used in AWS/GCP/Azure
- Doesn't work in Kind (local cluster)

```yaml
apiVersion: v1
kind: Service
metadata:
  name: app-service
spec:
  type: LoadBalancer
  selector:
    app: myapp
  ports:
  - port: 80
    targetPort: 8080
```

**Service Discovery**:

Kubernetes provides automatic DNS:
```
<service-name>.<namespace>.svc.cluster.local

Examples:
- postgres-service.task-app.svc.cluster.local
- backend-service.task-app.svc.cluster.local
- redis-service.task-app.svc.cluster.local

Short form (within same namespace):
- postgres-service
- backend-service
- redis-service
```

**Commands**:
```bash
# Create service
kubectl apply -f service.yaml

# List services
kubectl get services
kubectl get svc

# Describe service
kubectl describe service backend-service

# View endpoints (pod IPs behind service)
kubectl get endpoints backend-service

# Test DNS resolution
kubectl run test-dns --image=busybox:1.35 --rm -it --restart=Never -- nslookup backend-service

# Port forward (local testing)
kubectl port-forward service/backend-service 8080:3000
# Access: http://localhost:8080
```

---

## Application Deployment

### Build and Load Images (Kind-specific)

```bash
# Backend
cd app/backend
docker build -t task-backend:v1 .
kind load docker-image task-backend:v1 --name bootcamp

# Frontend
cd app/frontend
docker build -t task-frontend:v1 .
kind load docker-image task-frontend:v1 --name bootcamp

# Verify images in cluster
docker exec -it bootcamp-control-plane crictl images | grep task
```

### Deploy All Components

```bash
# Create namespace
kubectl apply -f k8s/base/namespace.yaml

# Create configuration
kubectl apply -f k8s/base/configmap.yaml
kubectl apply -f k8s/base/secrets.yaml

# Deploy database and cache
kubectl apply -f k8s/base/postgres-deployment.yaml
kubectl apply -f k8s/base/redis-deployment.yaml

# Wait for database to be ready
kubectl wait --for=condition=ready pod -l app=postgres --timeout=120s

# Deploy backend
kubectl apply -f k8s/base/backend-deployment.yaml

# Wait for backend to be ready
kubectl wait --for=condition=ready pod -l app=backend --timeout=120s

# Deploy frontend
kubectl apply -f k8s/base/frontend-deployment.yaml

# Verify all running
kubectl get all -n task-app
```

### Verify Deployment

```bash
# Check all pods are running
kubectl get pods

# Check services
kubectl get services

# Test backend health
curl http://localhost:30081/health

# Test backend API
curl http://localhost:30081/api/tasks

# Open frontend in browser
open http://localhost:30080
```

---

## Operations Guide

### Health Checks (Probes)

#### Liveness Probe
**Purpose**: Determine if container is alive

**Action if fails**: Restart container

**Example**:
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 30  # Wait before first check
  periodSeconds: 10        # Check every 10 seconds
  timeoutSeconds: 5        # Timeout after 5 seconds
  failureThreshold: 3      # Restart after 3 failures
```

#### Readiness Probe
**Purpose**: Determine if container is ready for traffic

**Action if fails**: Remove from service endpoints (no traffic)

**Example**:
```yaml
readinessProbe:
  httpGet:
    path: /ready
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 3
```

**Probe Types**:

```yaml
# HTTP GET
httpGet:
  path: /health
  port: 8080

# TCP Socket
tcpSocket:
  port: 3306

# Command execution
exec:
  command:
  - cat
  - /tmp/healthy
```

### Resource Management

**Resource Requests & Limits**:

```yaml
resources:
  requests:
    memory: "256Mi"  # Minimum guaranteed
    cpu: "200m"      # 0.2 CPU cores
  limits:
    memory: "512Mi"  # Maximum allowed
    cpu: "500m"      # 0.5 CPU cores
```

**CPU Units**:
- `1000m` = 1 CPU core
- `500m` = 0.5 CPU cores
- `100m` = 0.1 CPU cores

**Memory Units**:
- `Mi` = Mebibytes (1024-based)
- `Gi` = Gibibytes
- `M` = Megabytes (1000-based)
- `G` = Gigabytes

**QoS Classes** (determined by requests/limits):

1. **Guaranteed**: requests = limits (best priority)
2. **Burstable**: requests < limits (medium priority)
3. **BestEffort**: no requests/limits (lowest priority)

### Scaling

**Manual Scaling**:
```bash
# Scale up
kubectl scale deployment backend --replicas=5

# Scale down
kubectl scale deployment backend --replicas=2

# Check status
kubectl get deployment backend
```

**Horizontal Pod Autoscaler** (future class):
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### Rolling Updates

**Strategy**:
```yaml
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1        # Max extra pods during update
      maxUnavailable: 0  # Max unavailable pods
```

**Update Process**:
```bash
# Update image
kubectl set image deployment/backend backend=task-backend:v2

# Monitor rollout
kubectl rollout status deployment/backend

# Check rollout history
kubectl rollout history deployment/backend

# Check specific revision
kubectl rollout history deployment/backend --revision=2
```

**Rollback**:
```bash
# Undo last rollout
kubectl rollout undo deployment/backend

# Rollback to specific revision
kubectl rollout undo deployment/backend --to-revision=1

# Pause rollout (during issues)
kubectl rollout pause deployment/backend

# Resume after fixing
kubectl rollout resume deployment/backend
```

### Self-Healing Demonstration

```bash
# Delete a pod
kubectl delete pod <pod-name>

# Watch it recreate automatically
kubectl get pods -w

# Deployment controller ensures desired state
```

---
## PV and PVC

**PersistentVolume (PV)**: Actual storage resource
- Created by cluster admin
- Represents real storage (disk, NFS, cloud storage)
- Exists independent of pods

**PersistentVolumeClaim (PVC)**: Request for storage
- Created by developers
- Requests specific size and access mode
- Kubernetes binds PVC to suitable PV

**Think of it like:**
- **PV** = Apartment building (physical storage)
- **PVC** = Rental application (storage request)
- **Binding** = Getting assigned an apartment


### Storage Workflow
```
Developer creates PVC:
"I need 10Gi storage with ReadWriteOnce"
           ↓
Kubernetes finds matching PV
           ↓
PVC bound to PV
           ↓
Pod uses PVC in volume definition
           ↓
Data persists even if pod deleted
```



Let's fix our PostgreSQL to use persistent storage!
Create k8s/base/postgres-pv.yaml:
```yml
yaml# PersistentVolume - The actual storage
apiVersion: v1
kind: PersistentVolume
metadata:
  name: postgres-pv
  labels:
    type: local
spec:
  storageClassName: manual
  capacity:
    storage: 5Gi
  accessModes:
    - ReadWriteOnce  # Can be mounted by single node for read/write
  hostPath:
    path: "/mnt/data/postgres"  # On the Kind node
  persistentVolumeReclaimPolicy: Retain  # Keep data when PVC deleted

---
# PersistentVolumeClaim - The storage request
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
  namespace: task-app
spec:
  storageClassName: manual
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
Access Modes Explained:
```

- **ReadWriteOnce** (RWO): Mount by single node (read-write)
- **ReadOnlyMany** (ROX): Mount by multiple nodes (read-only)
- **ReadWriteMany** (RWX): Mount by multiple nodes (read-write)

Update k8s/base/postgres-deployment.yaml:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
  namespace: task-app
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        ports:
        - containerPort: 5432
        env:
        - name: POSTGRES_DB
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: DB_NAME
        - name: POSTGRES_USER
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: DB_USER
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: DB_PASSWORD
        - name: PGDATA
          value: /var/lib/postgresql/data/pgdata  # Important!
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          exec:
            command:
            - pg_isready
            - -U
            - postgres
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          exec:
            command:
            - pg_isready
            - -U
            - postgres
          initialDelaySeconds: 5
          periodSeconds: 5
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
      volumes:
      - name: postgres-storage
        persistentVolumeClaim:
          claimName: postgres-pvc  # ✅ Using PVC now!
```

---

## Troubleshooting

### Pod Issues

**Pod not starting**:
```bash
# Check pod status
kubectl get pods

# Common statuses:
# - Pending: Waiting for scheduling
# - ContainerCreating: Pulling image
# - Running: All good
# - CrashLoopBackOff: Container keeps crashing
# - ImagePullBackOff: Can't pull image
# - Error: Container failed

# Describe pod (see events)
kubectl describe pod <pod-name>

# Check logs
kubectl logs <pod-name>
kubectl logs <pod-name> --previous  # Logs from crashed container

# Multiple containers in pod
kubectl logs <pod-name> -c <container-name>

# Follow logs (tail -f)
kubectl logs -f <pod-name>

# Get shell access
kubectl exec -it <pod-name> -- /bin/sh
kubectl exec -it <pod-name> -- /bin/bash
```

**Common Issues & Solutions**:

#### ImagePullBackOff
```bash
# Issue: Can't pull image
# Causes:
# - Image doesn't exist
# - Wrong image name/tag
# - Image not loaded into Kind
# - Private registry auth missing

# Solution for Kind:
kind load docker-image my-image:v1 --name bootcamp

# Check images in node:
docker exec -it bootcamp-control-plane crictl images
```

#### CrashLoopBackOff
```bash
# Issue: Container keeps crashing
# Check logs for errors:
kubectl logs <pod-name>
kubectl logs <pod-name> --previous

# Common causes:
# - Application error
# - Missing environment variables
# - Wrong command/entrypoint
# - Health check failing too early

# Solution: Fix application or adjust probes
```

#### Pending
```bash
# Issue: Pod not scheduled
# Check events:
kubectl describe pod <pod-name>

# Common causes:
# - Insufficient resources
# - No nodes match selector
# - PVC not bound

# Check node resources:
kubectl top nodes
kubectl describe nodes
```

### Service Issues

**Can't reach service**:
```bash
# Check service exists
kubectl get service <service-name>

# Check endpoints (should show pod IPs)
kubectl get endpoints <service-name>

# If no endpoints, check:
# 1. Pods are running
kubectl get pods -l app=<label>

# 2. Labels match
kubectl get pods --show-labels
kubectl describe service <service-name>  # Check selector

# 3. Container port matches
kubectl describe pod <pod-name>  # Check ports
```

**DNS not working**:
```bash
# Test DNS resolution
kubectl run test-dns --image=busybox:1.35 --rm -it --restart=Never -- nslookup <service-name>

# Check CoreDNS pods
kubectl get pods -n kube-system -l k8s-app=kube-dns

# Check service FQDN
# Format: <service>.<namespace>.svc.cluster.local
nslookup backend-service.task-app.svc.cluster.local
```

### ConfigMap/Secret Issues

**Environment variables not set**:
```bash
# Check if ConfigMap exists
kubectl get configmap <name>

# Check contents
kubectl describe configmap <name>

# Verify pod has correct reference
kubectl describe pod <pod-name>  # Check Environment section

# Get into pod and check
kubectl exec -it <pod-name> -- env | grep <VAR_NAME>
```

### General Debugging Commands

```bash
# Get all resources
kubectl get all

# Wide output (more info)
kubectl get pods -o wide

# YAML output
kubectl get pod <name> -o yaml

# JSON output (for scripting)
kubectl get pod <name> -o json

# Watch resources (auto-refresh)
kubectl get pods -w

# Get events (cluster-wide)
kubectl get events --sort-by='.lastTimestamp'

# Get events for specific object
kubectl describe pod <name>  # Events section

# Resource usage
kubectl top nodes
kubectl top pods

# API resources available
kubectl api-resources

# Explain resource schema
kubectl explain deployment
kubectl explain deployment.spec
kubectl explain deployment.spec.template
```

---

## Quick Reference

### kubectl Cheat Sheet

#### Cluster Info
```bash
kubectl cluster-info
kubectl get nodes
kubectl describe node <name>
kubectl top nodes
```

#### Namespace Operations
```bash
kubectl get namespaces
kubectl create namespace <name>
kubectl delete namespace <name>
kubectl config set-context --current --namespace=<name>
```

#### Pod Operations
```bash
kubectl get pods
kubectl get pods -o wide
kubectl get pods -l app=backend
kubectl get pods --all-namespaces
kubectl describe pod <name>
kubectl logs <name>
kubectl logs -f <name>
kubectl logs <name> --previous
kubectl exec -it <name> -- /bin/sh
kubectl delete pod <name>
kubectl top pods
```

#### Deployment Operations
```bash
kubectl get deployments
kubectl describe deployment <name>
kubectl create deployment <name> --image=<image>
kubectl scale deployment <name> --replicas=3
kubectl set image deployment/<name> <container>=<image>
kubectl rollout status deployment/<name>
kubectl rollout history deployment/<name>
kubectl rollout undo deployment/<name>
kubectl delete deployment <name>
```

#### Service Operations
```bash
kubectl get services
kubectl get svc
kubectl describe service <name>
kubectl get endpoints <name>
kubectl expose deployment <name> --port=80 --target-port=8080
kubectl delete service <name>
```

#### ConfigMap Operations
```bash
kubectl get configmaps
kubectl describe configmap <name>
kubectl create configmap <name> --from-literal=key=value
kubectl create configmap <name> --from-file=<file>
kubectl delete configmap <name>
```

#### Secret Operations
```bash
kubectl get secrets
kubectl describe secret <name>
kubectl create secret generic <name> --from-literal=key=value
kubectl create secret generic <name> --from-file=<file>
kubectl get secret <name> -o jsonpath='{.data.key}' | base64 -d
kubectl delete secret <name>
```

#### Apply/Delete Resources
```bash
kubectl apply -f <file.yaml>
kubectl apply -f <directory>/
kubectl delete -f <file.yaml>
kubectl delete all --all  # Delete all resources in current namespace
```

#### Debug & Troubleshoot
```bash
kubectl describe <resource> <name>
kubectl logs <pod-name>
kubectl exec -it <pod-name> -- /bin/sh
kubectl get events
kubectl top nodes
kubectl top pods
kubectl port-forward pod/<name> 8080:80
kubectl run test --image=busybox --rm -it --restart=Never -- sh
```

### Common Label Selectors

```bash
# Equality-based
kubectl get pods -l app=backend
kubectl get pods -l app=backend,tier=api

# Set-based
kubectl get pods -l 'app in (backend,frontend)'
kubectl get pods -l 'tier notin (database)'

# Label operations
kubectl label pod <name> tier=api
kubectl label pod <name> tier-  # Remove label
```

### Output Formats

```bash
# Wide (more columns)
kubectl get pods -o wide

# YAML
kubectl get pod <name> -o yaml

# JSON
kubectl get pod <name> -o json

# JSONPath (extract specific fields)
kubectl get pods -o jsonpath='{.items[*].metadata.name}'

# Custom columns
kubectl get pods -o custom-columns=NAME:.metadata.name,STATUS:.status.phase
```

---

## Key Learnings

### Kubernetes Fundamentals

✅ **Declarative Configuration**
- You declare desired state (YAML)
- Kubernetes makes it happen
- Controllers continuously reconcile

✅ **Self-Healing**
- Pods crash → Deployment recreates them
- Nodes fail → Pods rescheduled elsewhere
- Health checks fail → Containers restarted

✅ **Service Discovery**
- Automatic DNS for services
- Stable networking despite pod changes
- Built-in load balancing

✅ **Rolling Updates**
- Zero-downtime deployments
- Gradual rollout with health checks
- Easy rollback capability

✅ **Resource Isolation**
- Namespaces for logical separation
- Resource requests/limits for guaranteed resources
- Labels and selectors for organization

### Best Practices Learned

✅ **Configuration Management**
- Use ConfigMaps for non-sensitive data
- Use Secrets for sensitive data
- Never hardcode config in images

✅ **Health Checks**
- Always define liveness probes
- Always define readiness probes
- Set appropriate delays and thresholds

✅ **Resource Management**
- Always set resource requests (for scheduling)
- Set resource limits (prevent resource hogging)
- Monitor actual usage

✅ **Labels and Annotations**
- Use consistent labeling strategy
- Include app, tier, version labels
- Use annotations for metadata

✅ **Image Management**
- Use specific version tags (not :latest)
- For Kind: load images explicitly
- For production: use container registries

### kubectl vs Lens

**Use kubectl for:**
- ✅ Automation and scripting
- ✅ CI/CD pipelines
- ✅ Initial learning (understand concepts)
- ✅ Quick commands
- ✅ Troubleshooting

**Use Lens for:**
- ✅ Visual exploration
- ✅ Real-time monitoring
- ✅ Easy log viewing
- ✅ Resource

