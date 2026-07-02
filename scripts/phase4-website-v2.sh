#!/bin/bash
set -euo pipefail

# =============================================================================
# Phase 4 v2 — Deploy Showcase Website (Node.js & Live Dashboard)
# Usage: ./phase4-website-v2.sh <VM_IP> <SSH_KEY_PATH>
# =============================================================================

VM_IP="${1:?Usage: ./phase4-website-v2.sh <VM_IP> <SSH_KEY_PATH>}"
SSH_KEY="${2:?Usage: ./phase4-website-v2.sh <VM_IP> <SSH_KEY_PATH>}"
SSH_USER="ubuntu"
SSH_CMD="ssh -o StrictHostKeyChecking=no -i ${SSH_KEY} ${SSH_USER}@${VM_IP}"
SCP_CMD="scp -o StrictHostKeyChecking=no -i ${SSH_KEY}"
NIP_DOMAIN="${VM_IP}.nip.io"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=========================================="
echo "🌐 Phase 4 (v2) — Premium Showcase Website"
echo "   Target: ${SSH_USER}@${VM_IP}"
echo "=========================================="

# --- Step 1: Copy website files ---
echo ""
echo "[1/3] 📦 Copying frontend & Node.js backend files..."
$SSH_CMD "mkdir -p ~/showcase-website/{css,js,assets}"

# Copy all required Node.js files and static assets
$SCP_CMD "${PROJECT_DIR}/website/Dockerfile" "${SSH_USER}@${VM_IP}:~/showcase-website/"
$SCP_CMD "${PROJECT_DIR}/website/package.json" "${SSH_USER}@${VM_IP}:~/showcase-website/"
$SCP_CMD "${PROJECT_DIR}/website/server.js" "${SSH_USER}@${VM_IP}:~/showcase-website/"
$SCP_CMD "${PROJECT_DIR}/website/index.html" "${SSH_USER}@${VM_IP}:~/showcase-website/"
$SCP_CMD "${PROJECT_DIR}/website/css/style.css" "${SSH_USER}@${VM_IP}:~/showcase-website/css/"
$SCP_CMD "${PROJECT_DIR}/website/js/particles.js" "${SSH_USER}@${VM_IP}:~/showcase-website/js/"
$SCP_CMD "${PROJECT_DIR}/website/js/app.js" "${SSH_USER}@${VM_IP}:~/showcase-website/js/"

# Note: Assets dir might be empty or contain images, we copy if it exists
if [ -d "${PROJECT_DIR}/website/assets" ] && [ "$(ls -A ${PROJECT_DIR}/website/assets)" ]; then
    $SCP_CMD -r "${PROJECT_DIR}/website/assets/"* "${SSH_USER}@${VM_IP}:~/showcase-website/assets/"
fi

echo "✅ Files copied!"

# --- Step 2: Build & deploy ---
echo ""
echo "[2/3] 🐳 Building Node.js image & deploying to Kubernetes..."
$SSH_CMD << OUTER_EOF
export KUBECONFIG=~/.kube/config

# Build image using nerdctl
cd ~/showcase-website
sudo nerdctl --address /run/k3s/containerd/containerd.sock --namespace k8s.io build -t showcase-website:latest .

# Create namespace
kubectl create namespace showcase 2>/dev/null || true

# Deploy all K8s resources
cat <<YAML | kubectl apply -f -
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: showcase-sa
  namespace: showcase
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: showcase-cluster-reader
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: view
subjects:
- kind: ServiceAccount
  name: showcase-sa
  namespace: showcase
---
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
      serviceAccountName: showcase-sa
      containers:
        - name: website
          image: showcase-website:latest
          imagePullPolicy: Never
          ports:
            - containerPort: 3000
          resources:
            requests:
              cpu: 50m
              memory: 64Mi
            limits:
              cpu: 200m
              memory: 128Mi
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
      targetPort: 3000
---
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: showcase-route
  namespace: showcase
spec:
  parentRefs:
  - name: main-gateway
    namespace: default
  hostnames:
  - "showcase.${NIP_DOMAIN}"
  rules:
  - matches:
    - path:
        type: PathPrefix
        value: /
    backendRefs:
    - name: showcase-website
      port: 80
YAML

# Force restart to pick up latest local image
kubectl rollout restart deployment/showcase-website -n showcase

echo "Waiting for website rollout..."
kubectl -n showcase rollout status deployment/showcase-website --timeout=120s
echo ""
echo "✅ Website deployed!"
OUTER_EOF

# --- Step 3: Verify ---
echo ""
echo "[3/3] ✅ Verifying..."
sleep 5
HTTP_CODE=\$(curl -s -o /dev/null -w "%{http_code}" "http://showcase.${NIP_DOMAIN}" 2>/dev/null || echo "000")
if [ "\$HTTP_CODE" = "200" ]; then
  echo "✅ Website is live and responding with HTTP 200!"
else
  echo "⚠️  Website returned HTTP \${HTTP_CODE} — it may take a moment to be fully ready."
fi

echo ""
echo "=========================================="
echo "✅ Phase 4 (v2) Complete!"
echo "=========================================="
echo ""
echo "🌐 Your DevOps Showcase is live at:"
echo "   👉 http://showcase.${NIP_DOMAIN}"
