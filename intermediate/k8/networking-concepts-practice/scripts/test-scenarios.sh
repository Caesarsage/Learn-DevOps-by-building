#!/bin/bash
# test-scenarios.sh

echo "Testing Kubernetes Networking Scenarios..."

# Test 1: Pod-to-Pod Communication
echo "Test 1: Pod-to-Pod Communication"
kubectl exec -it shopping-cart -- wget -qO- --timeout=5 http://$(kubectl get pod product-catalog -o jsonpath='{.status.podIP}'):80 > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Pod-to-Pod communication works"
else
    echo "❌ Pod-to-Pod communication failed"
fi

# Test 2: Service Discovery
echo "Test 2: Service Discovery"
kubectl exec -it shopping-cart -- wget -qO- --timeout=5 http://product-catalog-service.default.svc.cluster.local:80 > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Service discovery works"
else
    echo "❌ Service discovery failed"
fi

# Test 3: DNS Resolution
echo "Test 3: DNS Resolution"
kubectl exec -it shopping-cart -- nslookup product-catalog-service.default.svc.cluster.local > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ DNS resolution works"
else
    echo "❌ DNS resolution failed"
fi

# Test 4: External Access
echo "Test 4: External Access"
NODE_IP=$(docker inspect networking-lab-worker --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}')
curl -s --max-time 5 http://$NODE_IP:30080 > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ External access works"
else
    echo "❌ External access failed"
fi

echo "Testing completed!"
