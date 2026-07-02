#!/bin/bash
set -euo pipefail

# =============================================================================
# Phase 4 — Deploy Showcase Website
# Usage: ./phase4-website.sh <VM_IP> <SSH_KEY_PATH>
# =============================================================================

VM_IP="${1:?Usage: ./phase4-website.sh <VM_IP> <SSH_KEY_PATH>}"
SSH_KEY="${2:?Usage: ./phase4-website.sh <VM_IP> <SSH_KEY_PATH>}"
SSH_USER="ubuntu"
SSH_CMD="ssh -o StrictHostKeyChecking=no -i ${SSH_KEY} ${SSH_USER}@${VM_IP}"
SCP_CMD="scp -o StrictHostKeyChecking=no -i ${SSH_KEY}"
NIP_DOMAIN="${VM_IP}.nip.io"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=========================================="
echo "🌐 Phase 4 — Showcase Website"
echo "   Target: ${SSH_USER}@${VM_IP}"
echo "=========================================="

# --- Step 1: Copy website files ---
echo ""
echo "[1/3] 📦 Copying website files..."
$SSH_CMD "mkdir -p ~/showcase-website/{css,js}"
$SCP_CMD "${PROJECT_DIR}/website/index.html" "${SSH_USER}@${VM_IP}:~/showcase-website/"
$SCP_CMD "${PROJECT_DIR}/website/nginx.conf" "${SSH_USER}@${VM_IP}:~/showcase-website/"
$SCP_CMD "${PROJECT_DIR}/website/Dockerfile" "${SSH_USER}@${VM_IP}:~/showcase-website/"
$SCP_CMD "${PROJECT_DIR}/website/css/style.css" "${SSH_USER}@${VM_IP}:~/showcase-website/css/"
$SCP_CMD "${PROJECT_DIR}/website/js/particles.js" "${SSH_USER}@${VM_IP}:~/showcase-website/js/"
$SCP_CMD "${PROJECT_DIR}/website/js/app.js" "${SSH_USER}@${VM_IP}:~/showcase-website/js/"
echo "✅ Files copied!"

# --- Step 2: Build & deploy ---
echo ""
echo "[2/3] 🐳 Building & deploying..."
$SSH_CMD << OUTER_EOF
export KUBECONFIG=~/.kube/config

# Build image
cd ~/showcase-website
sudo nerdctl --address /run/k3s/containerd/containerd.sock --namespace k8s.io build -t showcase-website:v2 .

# Create namespace
kubectl create namespace showcase 2>/dev/null || true

# Deploy
cat <<YAML | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: showcase-website
  namespace: showcase
  labels:
    app: showcase-website
spec:
  replicas: 1
  selector:
    matchLabels:
      app: showcase-website
  template:
    metadata:
      labels:
        app: showcase-website
    spec:
      containers:
        - name: website
          image: showcase-website:v2
          imagePullPolicy: Never
          ports:
            - containerPort: 80
          resources:
            requests:
              cpu: 50m
              memory: 32Mi
            limits:
              cpu: 200m
              memory: 64Mi
---
apiVersion: v1
kind: Service
metadata:
  name: showcase-website
  namespace: showcase
spec:
  selector:
    app: showcase-website
  ports:
    - port: 80
      targetPort: 80
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: showcase-ingress
  namespace: showcase
spec:
  ingressClassName: nginx
  rules:
  - host: showcase.${NIP_DOMAIN}
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: showcase-website
            port:
              number: 80
YAML

echo "Waiting for website to be ready..."
kubectl -n showcase rollout status deployment/showcase-website --timeout=120s
echo ""
echo "✅ Website deployed!"
kubectl -n showcase get pods
OUTER_EOF

# --- Step 3: Verify ---
echo ""
echo "[3/3] ✅ Verifying..."
sleep 5
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://showcase.${NIP_DOMAIN}" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Website is live and responding with HTTP 200!"
else
  echo "⚠️  Website returned HTTP ${HTTP_CODE} — it may take a moment to be fully ready."
fi

echo ""
echo "=========================================="
echo "✅ Phase 4 Complete!"
echo "=========================================="
echo ""
echo "🌐 Your DevOps Showcase is live at:"
echo ""
echo "   👉 http://showcase.${NIP_DOMAIN}"
echo ""
echo "All services:"
echo "   🌐 Showcase:    http://showcase.${NIP_DOMAIN}"
echo "   🐣 Tamagotchi:  http://demo.${NIP_DOMAIN}"
echo "   🔄 ArgoCD:      https://argocd.${NIP_DOMAIN}  (guest / <YOUR_GUEST_PASSWORD>)"
echo "   📈 Grafana:     http://grafana.${NIP_DOMAIN}   (admin / <YOUR_ADMIN_PASSWORD>)"
echo "   📊 Prometheus:  http://prometheus.${NIP_DOMAIN}"
echo "   🐙 Gitea:       http://git.${NIP_DOMAIN}       (khalil / <YOUR_ADMIN_PASSWORD>)"
