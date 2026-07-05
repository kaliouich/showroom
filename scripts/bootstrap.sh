#!/bin/bash
set -euo pipefail

# =============================================================================
# Phase 1 — Bootstrap Script for OCI VM
# Installs: K3s, Helm, Nginx Ingress, Cert-Manager
# Usage: ./bootstrap.sh <VM_IP> <SSH_KEY_PATH>
# =============================================================================

VM_IP="${1:?Usage: ./bootstrap.sh <VM_IP> <SSH_KEY_PATH>}"
SSH_KEY="${2:?Usage: ./bootstrap.sh <VM_IP> <SSH_KEY_PATH>}"
SSH_USER="ubuntu"
SSH_CMD="ssh -o StrictHostKeyChecking=no -i ${SSH_KEY} ${SSH_USER}@${VM_IP}"

echo "=========================================="
echo "🚀 Phase 1 — Infrastructure Bootstrap"
echo "   Target: ${SSH_USER}@${VM_IP}"
echo "=========================================="

# --- Step 1: System Update ---
echo ""
echo "[1/5] 📦 Updating system packages..."
$SSH_CMD << 'EOF'
sudo apt-get update -y && sudo apt-get upgrade -y
sudo apt-get install -y curl wget git apt-transport-https ca-certificates
EOF

# --- Step 2: Install K3s (without Traefik) ---
echo ""
echo "[2/5] ☸️  Installing K3s (without Traefik)..."
$SSH_CMD << 'EOF'
curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="--disable=traefik" sh -

# Wait for K3s to be ready
echo "Waiting for K3s to be ready..."
until sudo kubectl get nodes 2>/dev/null | grep -q " Ready"; do
  sleep 3
done
echo "✅ K3s is ready!"

# Set up kubeconfig for the ubuntu user
mkdir -p ~/.kube
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown $(id -u):$(id -g) ~/.kube/config
chmod 600 ~/.kube/config
echo "export KUBECONFIG=~/.kube/config" >> ~/.bashrc
export KUBECONFIG=~/.kube/config

kubectl get nodes
EOF

# --- Step 3: Install Helm ---
echo ""
echo "[3/5] ⎈ Installing Helm..."
$SSH_CMD << 'EOF'
export KUBECONFIG=~/.kube/config
curl -fsSL https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
helm version
EOF

# --- Step 4: Install Nginx Ingress Controller ---
echo ""
echo "[4/5] 🌐 Installing Nginx Ingress Controller..."
$SSH_CMD << 'EOF'
export KUBECONFIG=~/.kube/config

helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.kind=DaemonSet \
  --set controller.hostNetwork=true \
  --set controller.service.type=ClusterIP \
  --set controller.watchIngressWithoutClass=true

echo "Waiting for Nginx Ingress to be ready..."
kubectl wait --namespace ingress-nginx \
  --for=condition=Available deployment/ingress-nginx-controller \
  --timeout=120s 2>/dev/null || \
kubectl -n ingress-nginx rollout status daemonset/ingress-nginx-controller --timeout=120s 2>/dev/null || true

echo "✅ Nginx Ingress Controller installed!"
kubectl -n ingress-nginx get pods
EOF

# --- Step 5: Install Cert-Manager ---
echo ""
echo "[5/5] 🔒 Installing Cert-Manager..."
$SSH_CMD << 'EOF'
export KUBECONFIG=~/.kube/config

helm repo add jetstack https://charts.jetstack.io
helm repo update

helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --set crds.enabled=true

echo "Waiting for Cert-Manager to be ready..."
kubectl wait --namespace cert-manager \
  --for=condition=Available deployment/cert-manager \
  --timeout=120s

# Create a ClusterIssuer for Let's Encrypt (staging first for safety)
cat <<YAML | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: khalil.aliouich@gmail.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
YAML

echo "✅ Cert-Manager installed with Let's Encrypt ClusterIssuer!"
EOF

echo ""
echo "=========================================="
echo "✅ Phase 1 Complete!"
echo "=========================================="
echo ""
echo "K3s cluster is running at ${VM_IP}"
echo "Nginx Ingress is ready"
echo "Cert-Manager with Let's Encrypt is configured"
echo ""
echo "Services will be accessible via:"
echo "  - argocd.khalilaliouich.com"
echo "  - grafana.khalilaliouich.com"
echo "  - git.khalilaliouich.com"
echo "  - demo.khalilaliouich.com"
echo "  - showcase.khalilaliouich.com"
echo ""
echo "Next: Run phase2-platform.sh to deploy ArgoCD, Gitea, Monitoring"
