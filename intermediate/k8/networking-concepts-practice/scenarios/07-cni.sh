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
