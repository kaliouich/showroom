#!/bin/bash
set -euo pipefail

# =============================================================================
# Phase 3 — Deploy Tamagotchi as a Service
# Builds Docker images on the VM and deploys the 3-tier app
# Usage: ./phase3-tamagotchi.sh <VM_IP> <SSH_KEY_PATH>
# =============================================================================

VM_IP="${1:?Usage: ./phase3-tamagotchi.sh <VM_IP> <SSH_KEY_PATH>}"
SSH_KEY="${2:?Usage: ./phase3-tamagotchi.sh <VM_IP> <SSH_KEY_PATH>}"
SSH_USER="ubuntu"
SSH_CMD="ssh -o StrictHostKeyChecking=no -i ${SSH_KEY} ${SSH_USER}@${VM_IP}"
SCP_CMD="scp -o StrictHostKeyChecking=no -i ${SSH_KEY}"
NIP_DOMAIN="${VM_IP}.nip.io"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=========================================="
echo "🐣 Phase 3 — Tamagotchi as a Service"
echo "   Target: ${SSH_USER}@${VM_IP}"
echo "=========================================="

# --- Step 1: Copy source files to VM ---
echo ""
echo "[1/5] 📦 Copying source files to VM..."
$SSH_CMD "mkdir -p ~/tamagotchi/{api,frontend}"
$SCP_CMD "${PROJECT_DIR}/tamagotchi/api/package.json" "${SSH_USER}@${VM_IP}:~/tamagotchi/api/"
$SCP_CMD "${PROJECT_DIR}/tamagotchi/api/server.js" "${SSH_USER}@${VM_IP}:~/tamagotchi/api/"
$SCP_CMD "${PROJECT_DIR}/tamagotchi/api/Dockerfile" "${SSH_USER}@${VM_IP}:~/tamagotchi/api/"
$SCP_CMD "${PROJECT_DIR}/tamagotchi/frontend/index.html" "${SSH_USER}@${VM_IP}:~/tamagotchi/frontend/"
$SCP_CMD "${PROJECT_DIR}/tamagotchi/frontend/style.css" "${SSH_USER}@${VM_IP}:~/tamagotchi/frontend/"
$SCP_CMD "${PROJECT_DIR}/tamagotchi/frontend/app.js" "${SSH_USER}@${VM_IP}:~/tamagotchi/frontend/"
$SCP_CMD "${PROJECT_DIR}/tamagotchi/frontend/nginx.conf" "${SSH_USER}@${VM_IP}:~/tamagotchi/frontend/"
$SCP_CMD "${PROJECT_DIR}/tamagotchi/frontend/Dockerfile" "${SSH_USER}@${VM_IP}:~/tamagotchi/frontend/"
echo "✅ Files copied!"

# --- Step 2: Build Docker images using K3s's containerd ---
echo ""
echo "[2/5] 🐳 Building Docker images with nerdctl..."
$SSH_CMD << 'EOF'
# Install nerdctl if not present
if ! command -v nerdctl &> /dev/null; then
  echo "Installing nerdctl..."
  NERDCTL_VERSION=2.1.2
  curl -sSL "https://github.com/containerd/nerdctl/releases/download/v${NERDCTL_VERSION}/nerdctl-${NERDCTL_VERSION}-linux-arm64.tar.gz" | sudo tar xz -C /usr/local/bin
fi

# Install buildkit if not present
if ! command -v buildkitd &> /dev/null; then
  echo "Installing buildkit..."
  BUILDKIT_VERSION=0.21.1
  curl -sSL "https://github.com/moby/buildkit/releases/download/v${BUILDKIT_VERSION}/buildkit-v${BUILDKIT_VERSION}.linux-arm64.tar.gz" | sudo tar xz -C /usr/local
  
  # Create and start buildkitd service
  sudo tee /etc/systemd/system/buildkit.service > /dev/null <<'SVCEOF'
[Unit]
Description=BuildKit
After=network.target

[Service]
ExecStart=/usr/local/bin/buildkitd --addr unix:///run/buildkit/buildkitd.sock
Restart=always

[Install]
WantedBy=multi-user.target
SVCEOF
  sudo systemctl daemon-reload
  sudo systemctl enable --now buildkit
  sleep 3
fi

# Build API image
echo "Building tamagotchi-api image..."
cd ~/tamagotchi/api
sudo nerdctl --address /run/k3s/containerd/containerd.sock --namespace k8s.io build -t tamagotchi-api:latest .

# Build Frontend image
echo "Building tamagotchi-frontend image..."
cd ~/tamagotchi/frontend
sudo nerdctl --address /run/k3s/containerd/containerd.sock --namespace k8s.io build -t tamagotchi-frontend:latest .

echo "✅ Docker images built!"
sudo nerdctl --address /run/k3s/containerd/containerd.sock --namespace k8s.io images | grep tamagotchi
EOF

# --- Step 3: Copy and apply K8s manifests ---
echo ""
echo "[3/5] ☸️  Deploying K8s manifests..."
$SCP_CMD "${PROJECT_DIR}/k8s/tamagotchi/tamagotchi-all.yaml" "${SSH_USER}@${VM_IP}:~/tamagotchi/"
$SCP_CMD "${PROJECT_DIR}/k8s/rbac/visitor-rbac.yaml" "${SSH_USER}@${VM_IP}:~/tamagotchi/"

$SSH_CMD << OUTER_EOF
export KUBECONFIG=~/.kube/config

# Apply RBAC
kubectl apply -f ~/tamagotchi/visitor-rbac.yaml

# Apply Tamagotchi manifests
kubectl apply -f ~/tamagotchi/tamagotchi-all.yaml

# Create Ingress for Tamagotchi
cat <<YAML | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: tamagotchi-ingress
  namespace: tamagotchi
spec:
  ingressClassName: nginx
  rules:
  - host: demo.${NIP_DOMAIN}
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: tamagotchi-frontend
            port:
              number: 80
YAML

echo "Waiting for Tamagotchi pods to be ready..."
kubectl -n tamagotchi rollout status deployment/postgres --timeout=120s
sleep 5
kubectl -n tamagotchi rollout status deployment/tamagotchi-api --timeout=120s
kubectl -n tamagotchi rollout status deployment/tamagotchi-frontend --timeout=120s

echo ""
echo "✅ All Tamagotchi pods running:"
kubectl -n tamagotchi get pods
OUTER_EOF

# --- Step 4: Create Grafana Dashboard ---
echo ""
echo "[4/5] 📊 Creating Tamagotchi Grafana dashboard..."
$SSH_CMD << 'OUTER_EOF'
export KUBECONFIG=~/.kube/config

GRAFANA_POD=$(kubectl -n monitoring get pods -l app.kubernetes.io/name=grafana -o jsonpath='{.items[0].metadata.name}')

# Create the Tamagotchi dashboard
kubectl -n monitoring exec ${GRAFANA_POD} -- curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "dashboard": {
      "title": "🐣 Tamagotchi as a Service",
      "tags": ["tamagotchi", "demo"],
      "timezone": "browser",
      "refresh": "10s",
      "panels": [
        {
          "title": "Creatures Alive vs Dead",
          "type": "stat",
          "gridPos": {"h": 4, "w": 6, "x": 0, "y": 0},
          "targets": [{"expr": "tamagotchi_creatures_alive_total", "legendFormat": "Alive"}],
          "fieldConfig": {"defaults": {"color": {"mode": "fixed", "fixedColor": "green"}}}
        },
        {
          "title": "Creatures Dead",
          "type": "stat",
          "gridPos": {"h": 4, "w": 6, "x": 6, "y": 0},
          "targets": [{"expr": "tamagotchi_creatures_dead_total", "legendFormat": "Dead"}],
          "fieldConfig": {"defaults": {"color": {"mode": "fixed", "fixedColor": "red"}}}
        },
        {
          "title": "Average Hunger Level",
          "type": "gauge",
          "gridPos": {"h": 6, "w": 4, "x": 12, "y": 0},
          "targets": [{"expr": "avg(tamagotchi_hunger_level)", "legendFormat": "Avg Hunger"}],
          "fieldConfig": {"defaults": {"min": 0, "max": 100, "thresholds": {"steps": [{"color": "green", "value": 0}, {"color": "yellow", "value": 50}, {"color": "red", "value": 80}]}}}
        },
        {
          "title": "Average Happiness Score",
          "type": "gauge",
          "gridPos": {"h": 6, "w": 4, "x": 16, "y": 0},
          "targets": [{"expr": "avg(tamagotchi_happiness_score)", "legendFormat": "Avg Happiness"}],
          "fieldConfig": {"defaults": {"min": 0, "max": 100, "thresholds": {"steps": [{"color": "red", "value": 0}, {"color": "yellow", "value": 30}, {"color": "green", "value": 60}]}}}
        },
        {
          "title": "Average Energy Level",
          "type": "gauge",
          "gridPos": {"h": 6, "w": 4, "x": 20, "y": 0},
          "targets": [{"expr": "avg(tamagotchi_energy_level)", "legendFormat": "Avg Energy"}],
          "fieldConfig": {"defaults": {"min": 0, "max": 100, "thresholds": {"steps": [{"color": "red", "value": 0}, {"color": "yellow", "value": 30}, {"color": "green", "value": 60}]}}}
        },
        {
          "title": "Hunger Level per Creature",
          "type": "timeseries",
          "gridPos": {"h": 8, "w": 12, "x": 0, "y": 6},
          "targets": [{"expr": "tamagotchi_hunger_level", "legendFormat": "{{creature_name}} ({{creature_type}})"}]
        },
        {
          "title": "Happiness Score per Creature",
          "type": "timeseries",
          "gridPos": {"h": 8, "w": 12, "x": 12, "y": 6},
          "targets": [{"expr": "tamagotchi_happiness_score", "legendFormat": "{{creature_name}} ({{creature_type}})"}]
        },
        {
          "title": "Actions Performed",
          "type": "timeseries",
          "gridPos": {"h": 8, "w": 12, "x": 0, "y": 14},
          "targets": [
            {"expr": "rate(tamagotchi_feed_actions_total[5m])", "legendFormat": "Feed ({{creature_type}})"},
            {"expr": "rate(tamagotchi_play_actions_total[5m])", "legendFormat": "Play ({{creature_type}})"},
            {"expr": "rate(tamagotchi_sleep_actions_total[5m])", "legendFormat": "Sleep ({{creature_type}})"}
          ]
        },
        {
          "title": "HTTP Request Duration",
          "type": "timeseries",
          "gridPos": {"h": 8, "w": 12, "x": 12, "y": 14},
          "targets": [{"expr": "histogram_quantile(0.95, rate(tamagotchi_http_request_duration_seconds_bucket[5m]))", "legendFormat": "p95 latency"}]
        }
      ]
    },
    "overwrite": true
  }' \
  http://admin:<YOUR_ADMIN_PASSWORD>@localhost:3000/api/dashboards/db 2>/dev/null || true

echo "✅ Grafana dashboard created!"
OUTER_EOF

# --- Step 5: Push code to Gitea ---
echo ""
echo "[5/5] 🐙 Pushing Tamagotchi code to Gitea..."
$SSH_CMD << OUTER_EOF
export KUBECONFIG=~/.kube/config

# Wait for Gitea to be fully ready
sleep 5

# Get Gitea pod service URL
GITEA_SVC="http://gitea-http.gitea.svc.cluster.local:3000"

# Create repo in Gitea via API
curl -s -X POST "\${GITEA_SVC}/api/v1/user/repos" \
  -H "Content-Type: application/json" \
  -u "khalil:<YOUR_ADMIN_PASSWORD>" \
  -d '{"name": "tamagotchi-service", "description": "🐣 Tamagotchi as a Service — A fun 3-tier demo app", "auto_init": true, "default_branch": "main"}' 2>/dev/null || true

# Clone, add files, push
cd /tmp
rm -rf tamagotchi-repo
git clone "http://khalil:<YOUR_ADMIN_PASSWORD>@gitea-http.gitea.svc.cluster.local:3000/khalil/tamagotchi-service.git" tamagotchi-repo 2>/dev/null || \
  git clone "http://khalil:<YOUR_ADMIN_PASSWORD>@localhost:3000/khalil/tamagotchi-service.git" tamagotchi-repo 2>/dev/null || true

if [ -d tamagotchi-repo ]; then
  cd tamagotchi-repo
  cp -r ~/tamagotchi/api ./
  cp -r ~/tamagotchi/frontend ./
  cp ~/tamagotchi/tamagotchi-all.yaml ./k8s.yaml
  git add .
  git config user.email "khalil.aliouich@gmail.com"
  git config user.name "Khalil"
  git commit -m "feat: Initial Tamagotchi as a Service 🐣" 2>/dev/null || true
  git push origin main 2>/dev/null || true
  echo "✅ Code pushed to Gitea!"
else
  echo "⚠️ Could not clone Gitea repo (may not be fully ready). You can push manually later."
fi

rm -rf /tmp/tamagotchi-repo
OUTER_EOF

echo ""
echo "=========================================="
echo "✅ Phase 3 Complete!"
echo "=========================================="
echo ""
echo "🐣 Tamagotchi as a Service is live:"
echo "   App:       http://demo.${NIP_DOMAIN}"
echo "   API:       http://demo.${NIP_DOMAIN}/api/creatures"
echo "   Metrics:   http://demo.${NIP_DOMAIN}/api/../metrics"
echo "   Dashboard: http://grafana.${NIP_DOMAIN} (search 'Tamagotchi')"
echo "   Code:      http://git.${NIP_DOMAIN}/khalil/tamagotchi-service"
echo ""
echo "Next: Deploy the showcase website!"
