# Kubernetes Networking Hands-On Lab Guide

This lab provides practical implementations of all the scenarios described my article Kubernetes networking

## Prerequisites

- Docker installed and running
- kubectl installed
- Kind installed
- Helm installed (for some advanced scenarios)

## Setup Instructions

### 1. Install Required Tools

```bash
# Install Kind
curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.20.0/kind-linux-amd64
chmod +x ./kind
sudo mv ./kind /usr/local/bin/kind

# Install kubectl (if not already installed)
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/

# Install Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

### 2. Create Multi-Node Kind Cluster

```yaml
# cluster-config.yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
name: networking-lab
nodes:
- role: control-plane
  kubeadmConfigPatches:
  - |
    kind: InitConfiguration
    nodeRegistration:
      kubeletExtraArgs:
        node-labels: "topology.kubernetes.io/region=us-east-1,topology.kubernetes.io/zone=us-east-1a,ingress-ready=true"
  extraPortMappings:
  - containerPort: 80
    hostPort: 80
    protocol: TCP
  - containerPort: 443
    hostPort: 443
    protocol: TCP
- role: worker
  kubeadmConfigPatches:
  - |
    kind: JoinConfiguration
    nodeRegistration:
      kubeletExtraArgs:
        node-labels: "topology.kubernetes.io/region=us-east-1,topology.kubernetes.io/zone=us-east-1b"
- role: worker
  kubeadmConfigPatches:
  - |
    kind: JoinConfiguration
    nodeRegistration:
      kubeletExtraArgs:
        node-labels: "topology.kubernetes.io/region=us-west-2,topology.kubernetes.io/zone=us-west-2a"
networking:
  disableDefaultCNI: false
  kubeProxyMode: "iptables"
```

```bash
# Create the cluster
kind create cluster --config=cluster-config.yaml
```

[Setup](images/setup.png)

## Lab Scenarios

### Scenario 1: E-commerce Microservices Communication

Let's implement the e-commerce example from the guide:

```yaml
# 01-ecommerce-deployments.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: product-catalog
spec:
  replicas: 2
  selector:
    matchLabels:
      app: product-catalog
  template:
    metadata:
      labels:
        app: product-catalog
        tier: backend
    spec:
      containers:
      - name: catalog
        image: nginx:alpine
        ports:
        - containerPort: 80
        env:
        - name: SERVICE_NAME
          value: "product-catalog"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: shopping-cart
spec:
  replicas: 2
  selector:
    matchLabels:
      app: shopping-cart
  template:
    metadata:
      labels:
        app: shopping-cart
        tier: backend
    spec:
      containers:
      - name: cart
        image: nginx:alpine
        ports:
        - containerPort: 80
        env:
        - name: SERVICE_NAME
          value: "shopping-cart"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-auth
spec:
  replicas: 2
  selector:
    matchLabels:
      app: user-auth
  template:
    metadata:
      labels:
        app: user-auth
        tier: backend
    spec:
      containers:
      - name: auth
        image: nginx:alpine
        ports:
        - containerPort: 80
        env:
        - name: SERVICE_NAME
          value: "user-auth"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: payment-processor
spec:
  replicas: 1
  selector:
    matchLabels:
      app: payment-processor
  template:
    metadata:
      labels:
        app: payment-processor
        tier: secure
    spec:
      containers:
      - name: payment
        image: nginx:alpine
        ports:
        - containerPort: 80
        env:
        - name: SERVICE_NAME
          value: "payment-processor"


```

```bash
# Deploy the pods
kubectl apply -f scenarios/01-ecommerce-deployments.yaml

# Verify pod IPs and communication
kubectl get pods -o wide

# Test direct pod-to-pod communication
CART_POD=$(kubectl get pods -l app=shopping-cart -o jsonpath='{.items[0].metadata.name}')
CATALOG_IP=$(kubectl get pods -l app=product-catalog -o jsonpath='{.items[0].status.podIP}')

kubectl exec -it $CART_POD -- wget -qO- http://$CATALOG_IP/
```

[Pod communications](images/01-pod-communication.png)

### Scenario 2: Service Discovery and DNS

Create services for the e-commerce pods:

```yaml
# 02-ecommerce-services.yaml
apiVersion: v1
kind: Service
metadata:
  name: product-catalog
spec:
  selector:
    app: product-catalog
  ports:
  - port: 80
    targetPort: 80
  type: ClusterIP
---
apiVersion: v1
kind: Service
metadata:
  name: shopping-cart
spec:
  selector:
    app: shopping-cart
  ports:
  - port: 80
    targetPort: 80
  type: ClusterIP
---
apiVersion: v1
kind: Service
metadata:
  name: user-auth
spec:
  selector:
    app: user-auth
  ports:
  - port: 80
    targetPort: 80
  type: ClusterIP
---
apiVersion: v1
kind: Service
metadata:
  name: payment-processor
spec:
  selector:
    app: payment-processor
  ports:
  - port: 80
    targetPort: 80
  type: ClusterIP

```

```bash
# Deploy services
kubectl apply -f 02-ecommerce-services.yaml

kubectl get services
kubectl get endpoints

# Test service-to-service communication
kubectl exec -it $CART_POD -- wget -qO- http://$CATALOG_IP/

kubectl exec -it $CART_POD -- sh -c 'for i in $(seq 1 5); do wget -qO- http://product-catalog/; echo; done'

```

[Service discovery](images/02-service-dicovery.png)

### Scenario 3: Multi-Container Pod with Sidecar

Implement the logging sidecar pattern:

```yaml
# 03-sidecar-logging.yaml
apiVersion: v1
kind: Pod
metadata:
  name: app-with-sidecar
spec:
  containers:
  - name: main-app
    image: nginx:alpine
    ports:
    - containerPort: 80
    volumeMounts:
    - name: shared-logs
      mountPath: /var/log/nginx
  - name: log-sidecar
    image: busybox
    command: ["sh", "-c", "tail -f /var/log/nginx/access.log"]
    volumeMounts:
    - name: shared-logs
      mountPath: /var/log/nginx
  volumes:
  - name: shared-logs
    emptyDir: {}

```

```bash
# Deploy the multi-container pod
kubectl apply -f 03-sidecar-logging.yaml

# Verify both containers share network
kubectl exec -it app-with-sidecar -c main-app -- ip addr
kubectl exec -it app-with-sidecar -c log-sidecar -- ip addr

# Generate traffic to see sidecar in action
kubectl port-forward pod/app-with-sidecar 8080:80 &
curl http://localhost:8080

# Check sidecar logs
kubectl logs app-with-sidecar -c log-sidecar

```
[sidecar log](images/03-sidecar-logs.png)

[sidecar network](images/container-share-net.png)

### Scenario 4: Services types: External Access with LoadBalancer and NodePort

```yaml
# 04-service-types.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-frontend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web-frontend
  template:
    metadata:
      labels:
        app: web-frontend
    spec:
      containers:
      - name: web
        image: nginx:alpine
        ports:
        - containerPort: 80
---
# ClusterIP Service (default)
apiVersion: v1
kind: Service
metadata:
  name: frontend-clusterip
spec:
  type: ClusterIP
  selector:
    app: web-frontend
  ports:
  - port: 80
    targetPort: 80
---
# NodePort Service
apiVersion: v1
kind: Service
metadata:
  name: frontend-nodeport
spec:
  type: NodePort
  selector:
    app: web-frontend
  ports:
  - port: 80
    targetPort: 80
    nodePort: 30080

```

```bash
# Deploy web application
kubectl apply -f 04-service-types.yaml

kubectl run test-pod --image=busybox --command -- sleep 3600

kubectl exec -it test-pod -- wget -qO- http://frontend-clusterip/

NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')

docker exec -it networking-lab-worker curl http://$NODE_IP:30080
```
[service types](images/04-service-types.png)

### Scenario 5: Network Policies for Security

Create isolated namespaces with network policies:

```bash
# Create namespaces
kubectl create namespace production
kubectl create namespace development
kubectl create namespace secure-payment

# Label namespaces
kubectl label namespace production environment=production
kubectl label namespace development environment=development
kubectl label namespace secure-payment pci=true
```

```yaml
# 05-network-policies.yaml
# Default deny all ingress traffic in production
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-ingress
  namespace: production
spec:
  podSelector: {}
  policyTypes:
  - Ingress
---
# Allow only specific traffic to payment pods
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: payment-policy
  namespace: secure-payment
spec:
  podSelector:
    matchLabels:
      app: payment-processor
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          environment: production
    - podSelector:
        matchLabels:
          role: checkout
    ports:
    - protocol: TCP
      port: 80
  egress:
  - to:
    - ipBlock:
        cidr: 10.96.0.0/12  # Cluster internal traffic
    ports:
    - protocol: TCP
      port: 53  # DNS
  - to:
    - ipBlock:
        cidr: 192.168.1.0/24  # External payment gateway
    ports:
    - protocol: TCP
      port: 443
```

```bash
# Deploy network policies and test apps
kubectl apply -f 05-network-policies.yaml

kubectl apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: payment-processor
  namespace: secure-payment
spec:
  replicas: 1
  selector:
    matchLabels:
      app: payment-processor
  template:
    metadata:
      labels:
        app: payment-processor
    spec:
      containers:
      - name: payment
        image: nginx:alpine
        ports:
        - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: payment-service
  namespace: secure-payment
spec:
  selector:
    app: payment-processor
  ports:
  - port: 80
    targetPort: 80
EOF


# Test policy enforcement
kubectl run test-denied --image=busybox --command -- sleep 3600

kubectl exec -it test-denied -- wget --timeout=5 -qO- http://payment-service.secure-payment.svc.cluster.local/

The request will timeout because of the policy
```

[Network policy](images/06-network-policy.png)

### Scenario 6: Ingress Controller Setup

Install NGINX Ingress Controller in Kind:

```bash
# Install NGINX Ingress Controller for Kind
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml

# Wait for ingress controller to be ready
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=90s

# Check the ingress controller service to see which ports are exposed
kubectl get svc -n ingress-nginx
```

```yaml
# 06-ingress-example.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: dashboard-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: dashboard
  template:
    metadata:
      labels:
        app: dashboard
    spec:
      containers:
      - name: dashboard
        image: nginx:alpine
        ports:
        - containerPort: 80
        volumeMounts:
        - name: html
          mountPath: /usr/share/nginx/html
      volumes:
      - name: html
        configMap:
          name: dashboard-html
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
      - name: api
        image: nginx:alpine
        ports:
        - containerPort: 80
        volumeMounts:
        - name: html
          mountPath: /usr/share/nginx/html
      volumes:
      - name: html
        configMap:
          name: api-html
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: dashboard-html
data:
  index.html: |
    <h1>Dashboard Service</h1>
    <p>This is the dashboard application</p>
    <p>Path: /dashboard</p>
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: api-html
data:
  index.html: |
    <h1>API Service</h1>
    <p>This is the API service</p>
    <p>Path: /api</p>
---
apiVersion: v1
kind: Service
metadata:
  name: dashboard-service
spec:
  selector:
    app: dashboard
  ports:
  - port: 80
    targetPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: api-service
spec:
  selector:
    app: api
  ports:
  - port: 80
    targetPort: 80
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: company-apps
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  ingressClassName: nginx
  rules:
  - host: local.company.com
    http:
      paths:
      - path: /dashboard
        pathType: Prefix
        backend:
          service:
            name: dashboard-service
            port:
              number: 80
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: api-service
            port:
              number: 80
```

```bash
# Deploy ingress example
kubectl apply -f 06-ingress-example.yaml

# Wait for ingress to be ready
sleep 30

# Check ingress status
kubectl get ingress company-apps

# Find the correct ports for the ingress controller
kubectl get svc -n ingress-nginx ingress-nginx-controller

# The ingress controller in Kind typically runs on port 80 (mapped to host port 80)
# But we need to check the actual port mapping
INGRESS_PORT=$(kubectl get svc -n ingress-nginx ingress-nginx-controller -o jsonpath='{.spec.ports[0].nodePort}')
echo "Ingress is available on port: $INGRESS_PORT"

# Add to /etc/hosts
echo "127.0.0.1 local.company.com" | sudo tee -a /etc/hosts

# Test the ingress - use the correct port
# For Kind, typically you need to use port 80 for HTTP
curl -H "Host: local.company.com" http://localhost/dashboard
curl -H "Host: local.company.com" http://localhost/api

# Alternative: Direct curl to the service
curl http://local.company.com/dashboard
curl http://local.company.com/api
```
[Dshboard example](images/ingress-dashboard.png)
---
[API example](images/ingress-api.png)

**Troubleshooting Steps:**

```bash
# 1. Check if ingress controller is running
kubectl get pods -n ingress-nginx

# 2. Check ingress controller logs
kubectl logs -n ingress-nginx -l app.kubernetes.io/component=controller

# 3. Check if the ingress resource was created correctly
kubectl describe ingress company-apps

# 4. Check the service endpoints
kubectl get endpoints

# 5. Test direct service access first
kubectl port-forward svc/dashboard 8081:80 &
curl http://localhost:8180

# 6. Check docker port mapping for Kind
docker ps | grep kind

# 7. For Kind specifically, you might need to set up port forwarding
kubectl port-forward -n ingress-nginx svc/ingress-nginx-controller 8081:80 &
curl -H "Host: local.company.com" http://localhost:8081/dashboard

```

[Ingress controller](images/07-ingress-nginx.png)

### Scenario 7: CNI Plugin Investigation

```bash
# Examine CNI configuration
docker exec -it networking-lab-control-plane cat /etc/cni/net.d/10-kindnet.conflist

# Check CNI plugin pods
kubectl get pods -n kube-system -l app=kindnet

# Investigate pod networking
kubectl run debug-pod --image=nicolaka/netshoot --rm -it --restart=Never
# Inside the pod:
ip addr show
ip route show
nslookup kubernetes.default.svc.cluster.local
```

[cni plugin](images/cni-investigate.png)

### Scenario 8: Debugging Network Issues

Create a comprehensive debugging toolkit:

```yaml
# 08-debug-tools.yaml
apiVersion: v1
kind: Pod
metadata:
  name: netshoot
spec:
  containers:
  - name: netshoot
    image: nicolaka/netshoot
    command: ["/bin/bash"]
    args: ["-c", "sleep 3600"]
---
apiVersion: v1
kind: Pod
metadata:
  name: busybox-debug
spec:
  containers:
  - name: busybox
    image: busybox:latest
    command: ["/bin/sh"]
    args: ["-c", "sleep 3600"]
```

```bash
# Deploy debug tools
kubectl apply -f 08-debug-tools.yaml

# Common debugging commands
kubectl exec -it netshoot -- nslookup kubernetes.default.svc.cluster.local
kubectl exec -it netshoot -- ping google.com
kubectl exec -it netshoot -- traceroute 8.8.8.8
kubectl exec -it netshoot -- ss -tulpn

# Check kube-proxy logs
kubectl logs -n kube-system -l k8s-app=kube-proxy

# Examine CoreDNS
kubectl logs -n kube-system -l k8s-app=kube-dns
```

[Debug tools](images/08-debug-tools.png)

## Advanced Scenarios

### Scenario 9: Install Calico for Advanced Networking

```bash
# Remove Kind's default CNI and install Calico
kubectl delete daemonset -n kube-system kindnet
kubectl apply -f https://raw.githubusercontent.com/projectcalico/calico/v3.26.0/manifests/calico.yaml

# Wait for Calico to be ready
kubectl wait --for=condition=ready pod -l k8s-app=calico-node -n kube-system --timeout=180s

# Install calicoctl for policy management
curl -L https://github.com/projectcalico/calico/releases/download/v3.26.0/calicoctl-linux-amd64 -o calicoctl
chmod +x calicoctl
sudo mv calicoctl /usr/local/bin/
```

[Calico CNI Plugin](images/10-calico-cni.png)

To verify that Calico is running properly on your kind cluster, you can walk through these checks:

Ensure Calico pods are Ready

# List all Calico pods in the kube-system namespace
```bash
kubectl get pods -n kube-system -l k8s-app=calico-node

# You should see one calico-node pod per kind worker/control-plane node, all in Ready state

kubectl get daemonset calico-node -n kube-system

# DESIRED = CURRENT = READY should match your number of nodes.

# Check node status
calicoctl node status
# Should report 'Calico process is running' for each node

# Inspect IP pools
calicoctl get ippool -o wide
# Defaults look like 192.168.0.0/16 or similar

kubectl run --rm -it busybox --image=busybox -- /bin/sh
# In the Pod’s shell:
 ip addr show eth0
# You should see an IP from your Calico IP pool, e.g., 192.168.x.x
exit

# Test cross-Pod connectivity

# Launch two BusyBox pods
kubectl run bb1 --image=busybox --restart=Never -- sleep 3600
kubectl run bb2 --image=busybox --restart=Never -- sleep 3600
# Get bb2’s IP
BB2_IP=$(kubectl get pod bb2 -o jsonpath='{.status.podIP}')
# Exec into bb1 and ping bb2
kubectl exec -it bb1 -- ping -c 3 $BB2_IP
A successful ping confirms Calico is forwarding traffic between Pods.

# Look for warnings or errors in Calico node logs
kubectl logs -n kube-system -l k8s-app=calico-node
```

### Scenario 10: Traffic Monitoring with Calico

```yaml
# 10-calico-monitoring.yaml
apiVersion: projectcalico.org/v3
kind: NetworkPolicy
metadata:
  name: frontend-policy
  namespace: default
spec:
  selector: app == 'frontend'
  types:
  - Ingress
  - Egress
  ingress:
  - action: Log
    metadata:
      annotations:
        policy: "frontend-ingress"
  - action: Allow
    protocol: TCP
    destination:
      ports: [80, 443]
  egress:
  - action: Log
    metadata:
      annotations:
        policy: "frontend-egress"
  - action: Allow
```

## Cleanup

```bash
# Cleanup script
kubectl delete --all pods --all-namespaces
kubectl delete --all services --all-namespaces
kubectl delete --all ingresses --all-namespaces
kubectl delete --all networkpolicies --all-namespaces
kind delete cluster --name networking-lab
```

## Repository Structure

```
kubernetes-networking-lab/
├── README.md
├── images
├── cluster-config.yaml
├── scenarios/
│   ├── 01-ecommerce-pods.yaml
│   ├── 02-ecommerce-services.yaml
│   ├── 03-sidecar-logging.yaml
│   ├── 04-external-access.yaml
│   ├── 05-network-policies.yaml
│   ├── 06-ingress-example.yaml
│   ├── 08-debug-tools.yaml
│   └── 10-calico-monitoring.yaml
├── scripts/
│   ├── setup.sh
│   ├── test-scenarios.sh
│   └── cleanup.sh
└── docs/
    ├── troubleshooting.md
    └── advanced-topics.md
```

## Next Steps

1. **Clone this repository** and follow the scenarios step by step
2. **Experiment** with different CNI plugins (Calico, Cilium, Flannel)
3. **Monitor** network traffic using tools like Wireshark or tcpdump
4. **Implement** service mesh solutions (Istio, Linkerd) for advanced scenarios
5. **Contribute** additional scenarios or improvements to the lab

Each scenario builds upon the previous ones, providing a comprehensive understanding of Kubernetes networking concepts through hands-on practice.
