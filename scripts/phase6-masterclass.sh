#!/bin/bash
set -euo pipefail

VM_IP="${1:?Usage: ./phase6-masterclass.sh <VM_IP> <SSH_KEY_PATH>}"
SSH_KEY="${2:?Usage: ./phase6-masterclass.sh <VM_IP> <SSH_KEY_PATH>}"
SSH_USER="ubuntu"
SSH_CMD="ssh -o StrictHostKeyChecking=no -i ${SSH_KEY} ${SSH_USER}@${VM_IP}"
NIP_DOMAIN="khalilaliouich.com"

echo "=========================================="
echo "🌟 Phase 6 — Masterclass DevOps Expansion"
echo "   Target: ${SSH_USER}@${VM_IP}"
echo "=========================================="

$SSH_CMD << OUTER_EOF
export KUBECONFIG=~/.kube/config
echo "[1/6] 📥 Adding Helm repositories..."
helm repo add kyverno https://kyverno.github.io/kyverno/
helm repo add aqua https://aquasecurity.github.io/helm-charts/
helm repo add kubecost https://kubecost.github.io/cost-analyzer/
helm repo add woodpecker https://woodpecker-ci.org/
helm repo update

# ==========================================
# 1. KYVERNO (Policy as Code)
# ==========================================
echo ""
echo "[2/6] 🛡️ Installing Kyverno..."
kubectl create ns kyverno 2>/dev/null || true
helm upgrade --install kyverno kyverno/kyverno -n kyverno \
  --set replicaCount=1 \
  --set admissionController.replicas=1 \
  --set backgroundController.replicas=1 \
  --set cleanupController.replicas=1 \
  --set reportsController.replicas=1

# ==========================================
# 2. TRIVY OPERATOR (Security Scanning)
# ==========================================
echo ""
echo "[3/6] 🔍 Installing Trivy Operator..."
kubectl create ns trivy-system 2>/dev/null || true
helm upgrade --install trivy-operator aqua/trivy-operator -n trivy-system \
  --set operator.replicas=1 \
  --set trivy.ignoreUnfixed=true

# ==========================================
# 3. KUBECOST (FinOps)
# ==========================================
echo ""
echo "[4/6] 💸 Installing Kubecost..."
kubectl create ns kubecost 2>/dev/null || true
# We use our existing Prometheus to save RAM
helm upgrade --install kubecost kubecost/cost-analyzer -n kubecost \
  --set global.prometheus.enabled=false \
  --set global.prometheus.fqdn=http://prometheus-operated.monitoring.svc.cluster.local:9090 \
  --set global.grafana.enabled=false \
  --set prometheus.nodeExporter.enabled=false \
  --set prometheus.kubeStateMetrics.enabled=false

cat <<YAML | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: kubecost-ingress
  namespace: kubecost
spec:
  ingressClassName: nginx
  rules:
  - host: cost.${NIP_DOMAIN}
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: kubecost-cost-analyzer
            port:
              number: 9090
YAML

# ==========================================
# 4. LINKERD (Service Mesh)
# ==========================================
echo ""
echo "[6/6] 🕸️ Installing Linkerd..."
if ! command -v linkerd &> /dev/null; then
  curl --proto '=https' --tlsv1.2 -sSfL https://run.linkerd.io/install | sh
  sudo cp ~/.linkerd2/bin/linkerd /usr/local/bin/
fi

linkerd install --crds | kubectl apply -f -
linkerd install --set proxyInit.runAsRoot=true | kubectl apply -f -
# Inject Linkerd into Tamagotchi app
kubectl get deploy -n tamagotchi -o yaml | linkerd inject - | kubectl apply -f -

linkerd viz install | kubectl apply -f -

cat <<YAML | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: linkerd-viz-ingress
  namespace: linkerd-viz
  annotations:
    nginx.ingress.kubernetes.io/upstream-vhost: web.linkerd-viz.svc.cluster.local:8084
spec:
  ingressClassName: nginx
  rules:
  - host: linkerd.${NIP_DOMAIN}
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: web
            port:
              number: 8084
YAML

echo "=========================================="
echo "✅ Base installations initiated!"
echo "Note: Woodpecker CI will be configured in a separate step due to Gitea API requirements."
echo "=========================================="
OUTER_EOF
