#!/bin/bash
set -euo pipefail

ARGOCD_SECRET="477792633c4b798dae47d30e6ff202949b32f10f4ba8300fbb813cf291bf0dba"
B64_ARGOCD_SECRET=$(echo -n "$ARGOCD_SECRET" | base64 -w 0)

echo "Patching argocd-secret with OIDC clientSecret..."
kubectl patch secret argocd-secret -n argocd -p '{"data": {"oidc.authelia.clientSecret": "'$B64_ARGOCD_SECRET'"}}'

echo "Patching argocd-cm with OIDC config..."
kubectl patch configmap argocd-cm -n argocd --type merge -p '{"data": {
  "url": "https://argocd.khalilaliouich.com",
  "oidc.config": "name: Authelia\nissuer: https://auth.khalilaliouich.com\nclientID: argocd\nclientSecret: $oidc.authelia.clientSecret\nrequestedScopes: [\"openid\", \"profile\", \"email\", \"groups\"]\n"
}}'

echo "Patching argocd-rbac-cm with OIDC group mappings..."
kubectl patch configmap argocd-rbac-cm -n argocd --type merge -p '{"data": {
  "policy.csv": "g, admins, role:admin\ng, viewers, role:readonly\n",
  "policy.default": "role:readonly"
}}'

echo "Restarting ArgoCD Server..."
kubectl rollout restart deployment argocd-server -n argocd
kubectl rollout status deployment argocd-server -n argocd --timeout=60s || true

echo "✅ ArgoCD successfully configured for Authelia OIDC!"
