#!/bin/bash
set -euo pipefail

# =============================================================================
# DevOps Showcase — Master Deployment Script
# Usage: ./deploy-all-vps.sh <VM_IP> <SSH_KEY_PATH> [-y]
# =============================================================================

if [ "$#" -lt 2 ]; then
    echo "Usage: $0 <VM_IP> <SSH_KEY_PATH> [-y]"
    echo "  -y : Unattended mode (do not pause between phases)"
    exit 1
fi

VM_IP="$1"
SSH_KEY="$2"
UNATTENDED=0

if [ "${3:-}" == "-y" ]; then
    UNATTENDED=1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=================================================================="
echo "🚀 DevOps Showcase — Full Stack Deployment"
echo "   Target: ubuntu@${VM_IP}"
echo "=================================================================="

pause_or_continue() {
    if [ "$UNATTENDED" -eq 0 ]; then
        echo ""
        read -p "Press [Enter] to continue to the next phase, or Ctrl+C to abort..."
    fi
    echo ""
}

# --- Phase 1: Bootstrap (K3s, Helm, Cert-Manager) ---
echo "▶️  Running Phase 1: Bootstrap..."
"${SCRIPT_DIR}/bootstrap.sh" "$VM_IP" "$SSH_KEY"
pause_or_continue

# --- Phase 2: Platform (ArgoCD, Prometheus, Grafana, Gitea) ---
echo "▶️  Running Phase 2: Platform & Monitoring..."
"${SCRIPT_DIR}/phase2-platform.sh" "$VM_IP" "$SSH_KEY"
pause_or_continue

# --- Phase 3: Tamagotchi App (Backend/Frontend/Postgres) ---
echo "▶️  Running Phase 3: Tamagotchi Demo Application..."
"${SCRIPT_DIR}/phase3-tamagotchi.sh" "$VM_IP" "$SSH_KEY"
pause_or_continue

# --- Phase 4: Showcase Website (v2 - Node.js Backend) ---
echo "▶️  Running Phase 4: Premium Showcase Website..."
"${SCRIPT_DIR}/phase4-website-v2.sh" "$VM_IP" "$SSH_KEY"
pause_or_continue

# --- Phase 6: Masterclass (Linkerd, Kyverno, Trivy, etc) ---
echo "▶️  Running Phase 6: Masterclass DevOps Tooling..."
"${SCRIPT_DIR}/phase6-masterclass.sh" "$VM_IP" "$SSH_KEY"

echo ""
echo "=================================================================="
echo "🎉 ALL PHASES COMPLETED SUCCESSFULLY!"
echo "=================================================================="
echo "You can now access your DevOps environment at:"
echo "   🌐 Showcase:    https://showcase.khalilaliouich.com"
echo "   🐣 Tamagotchi:  https://demo.khalilaliouich.com"
echo "   🔄 ArgoCD:      https://argocd.khalilaliouich.com  (guest / <YOUR_GUEST_PASSWORD>)"
echo "   📈 Grafana:     https://grafana.khalilaliouich.com  (admin / <YOUR_ADMIN_PASSWORD>)"
echo "   🐙 Gitea:       https://git.khalilaliouich.com      (khalil / <YOUR_ADMIN_PASSWORD>)"
echo "=================================================================="
