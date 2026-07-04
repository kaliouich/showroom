#!/bin/bash
set -euo pipefail

# =============================================================================
# Phase 2 — Platform Services
# Deploys: ArgoCD, Gitea, Prometheus+Grafana+Loki
# Usage: ./phase2-platform.sh <VM_IP> <SSH_KEY_PATH>
# =============================================================================

VM_IP="${1:?Usage: ./phase2-platform.sh <VM_IP> <SSH_KEY_PATH>}"
SSH_KEY="${2:?Usage: ./phase2-platform.sh <VM_IP> <SSH_KEY_PATH>}"
SSH_USER="ubuntu"
SSH_CMD="ssh -o StrictHostKeyChecking=no -i ${SSH_KEY} ${SSH_USER}@${VM_IP}"
NIP_DOMAIN="khalilaliouich.com"

echo "=========================================="
echo "🚀 Phase 2 — Platform Services"
echo "   Target: ${SSH_USER}@${VM_IP}"
echo "   Domain: *.${NIP_DOMAIN}"
echo "=========================================="

# --- Step 1: Deploy ArgoCD ---
echo ""
echo "[1/4] 🔄 Installing ArgoCD..."
$SSH_CMD << OUTER_EOF
export KUBECONFIG=~/.kube/config

kubectl create namespace argocd 2>/dev/null || true
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

echo "Waiting for ArgoCD to be ready..."
kubectl -n argocd rollout status deployment/argocd-server --timeout=300s

# Configure ArgoCD: enable guest account (read-only)
kubectl -n argocd patch configmap argocd-cm --type merge -p '
{
  "data": {
    "accounts.guest": "login",
    "url": "https://argocd.${NIP_DOMAIN}"
  }
}'

# Set RBAC: guest is read-only
kubectl -n argocd patch configmap argocd-rbac-cm --type merge -p '
{
  "data": {
    "policy.csv": "g, guest, role:readonly",
    "policy.default": "role:readonly"
  }
}'

# Set guest password (simple password for visitors)
# First get the bcrypt hash
BCRYPT_HASH=\$(python3 -c "import bcrypt; print(bcrypt.hashpw(b'<YOUR_GUEST_PASSWORD>', bcrypt.gensalt()).decode())" 2>/dev/null || \
  sudo apt-get install -y python3-bcrypt && python3 -c "import bcrypt; print(bcrypt.hashpw(b'<YOUR_GUEST_PASSWORD>', bcrypt.gensalt()).decode())")

kubectl -n argocd patch secret argocd-secret --type merge -p "{
  \"stringData\": {
    \"accounts.guest.password\": \"\${BCRYPT_HASH}\"
  }
}"

# Restart argocd-server to apply changes
kubectl -n argocd rollout restart deployment argocd-server
kubectl -n argocd rollout status deployment/argocd-server --timeout=120s

# Create Ingress for ArgoCD
cat <<YAML | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: argocd-ingress
  namespace: argocd
  annotations:
    nginx.ingress.kubernetes.io/ssl-passthrough: "true"
    nginx.ingress.kubernetes.io/backend-protocol: "HTTPS"
spec:
  ingressClassName: nginx
  rules:
  - host: argocd.${NIP_DOMAIN}
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: argocd-server
            port:
              number: 443
YAML

echo "✅ ArgoCD installed!"
echo "   URL: https://argocd.${NIP_DOMAIN}"
echo "   Guest: guest / <YOUR_GUEST_PASSWORD>"

# Get admin password
ADMIN_PASS=\$(kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d)
echo "   Admin: admin / \${ADMIN_PASS}"
OUTER_EOF

# --- Step 2: Deploy Gitea ---
echo ""
echo "[2/4] 🐙 Installing Gitea..."
$SSH_CMD << OUTER_EOF
export KUBECONFIG=~/.kube/config

helm repo add gitea-charts https://dl.gitea.io/charts/
helm repo update

kubectl create namespace gitea 2>/dev/null || true

helm install gitea gitea-charts/gitea \
  --namespace gitea \
  --set gitea.admin.username=khalil \
  --set gitea.admin.password=<YOUR_ADMIN_PASSWORD> \
  --set gitea.admin.email=khalil.aliouich@gmail.com \
  --set gitea.config.server.DOMAIN=git.${NIP_DOMAIN} \
  --set gitea.config.server.ROOT_URL=http://git.${NIP_DOMAIN} \
  --set gitea.config.service.DISABLE_REGISTRATION=true \
  --set persistence.size=5Gi \
  --set resources.requests.memory=256Mi \
  --set resources.limits.memory=512Mi \
  --set resources.requests.cpu=100m \
  --set resources.limits.cpu=500m \
  --set postgresql.enabled=true \
  --set postgresql-ha.enabled=false \
  --set redis-cluster.enabled=false

echo "Waiting for Gitea to be ready..."
kubectl -n gitea rollout status statefulset/gitea --timeout=300s

# Create Ingress for Gitea
cat <<YAML | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: gitea-ingress
  namespace: gitea
spec:
  ingressClassName: nginx
  rules:
  - host: git.${NIP_DOMAIN}
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: gitea-http
            port:
              number: 3000
YAML

echo "✅ Gitea installed!"
echo "   URL: http://git.${NIP_DOMAIN}"
echo "   Admin: khalil / <YOUR_ADMIN_PASSWORD>"
OUTER_EOF

# --- Step 3: Deploy Prometheus + Grafana ---
echo ""
echo "[3/4] 📊 Installing Prometheus + Grafana stack..."
$SSH_CMD << OUTER_EOF
export KUBECONFIG=~/.kube/config

helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

kubectl create namespace monitoring 2>/dev/null || true

helm install kube-prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --set grafana.adminPassword=<YOUR_ADMIN_PASSWORD> \
  --set grafana.ingress.enabled=true \
  --set grafana.ingress.ingressClassName=nginx \
  --set "grafana.ingress.hosts[0]=grafana.${NIP_DOMAIN}" \
  --set prometheus.ingress.enabled=true \
  --set prometheus.ingress.ingressClassName=nginx \
  --set "prometheus.ingress.hosts[0]=prometheus.${NIP_DOMAIN}" \
  --set prometheus.prometheusSpec.resources.requests.memory=512Mi \
  --set prometheus.prometheusSpec.resources.limits.memory=1Gi \
  --set prometheus.prometheusSpec.resources.requests.cpu=200m \
  --set grafana.resources.requests.memory=128Mi \
  --set grafana.resources.limits.memory=256Mi \
  --set grafana.resources.requests.cpu=100m \
  --set "grafana.grafana\.ini.security.allow_embedding=true" \
  --set "grafana.grafana\.ini.auth\.anonymous.enabled=true" \
  --set "grafana.grafana\.ini.auth\.anonymous.org_role=Viewer"

echo "Waiting for Grafana to be ready..."
kubectl -n monitoring rollout status deployment/kube-prometheus-grafana --timeout=300s

echo "✅ Prometheus + Grafana installed!"
echo "   Grafana: http://grafana.${NIP_DOMAIN}"
echo "   Prometheus: http://prometheus.${NIP_DOMAIN}"
echo "   Grafana Admin: admin / <YOUR_ADMIN_PASSWORD>"
OUTER_EOF

# --- Step 4: Deploy Loki + Promtail ---
echo ""
echo "[4/4] 📝 Installing Loki + Promtail..."
$SSH_CMD << OUTER_EOF
export KUBECONFIG=~/.kube/config

helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

helm install loki grafana/loki-stack \
  --namespace monitoring \
  --set promtail.enabled=true \
  --set loki.resources.requests.memory=256Mi \
  --set loki.resources.limits.memory=512Mi \
  --set loki.resources.requests.cpu=100m

echo "Waiting for Loki to be ready..."
kubectl -n monitoring rollout status statefulset/loki --timeout=300s 2>/dev/null || true

# Add Loki as a datasource in Grafana
GRAFANA_POD=\$(kubectl -n monitoring get pods -l app.kubernetes.io/name=grafana -o jsonpath='{.items[0].metadata.name}')
kubectl -n monitoring exec \${GRAFANA_POD} -- curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"name":"Loki","type":"loki","url":"http://loki:3100","access":"proxy","isDefault":false}' \
  http://admin:<YOUR_ADMIN_PASSWORD>@localhost:3000/api/datasources 2>/dev/null || true

echo "✅ Loki + Promtail installed!"
OUTER_EOF

echo ""
echo "=========================================="
echo "✅ Phase 2 Complete!"
echo "=========================================="
echo ""
echo "All services are running:"
echo "  🔄 ArgoCD:     https://argocd.${NIP_DOMAIN}  (guest / <YOUR_GUEST_PASSWORD>)"
echo "  🐙 Gitea:      http://git.${NIP_DOMAIN}      (khalil / <YOUR_ADMIN_PASSWORD>)"
echo "  📈 Grafana:     http://grafana.${NIP_DOMAIN}   (admin / <YOUR_ADMIN_PASSWORD>)"
echo "  📊 Prometheus:  http://prometheus.${NIP_DOMAIN}"
echo ""
echo "Next: Run phase3-tamagotchi.sh to deploy the demo app"
