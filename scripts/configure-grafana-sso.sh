#!/bin/bash
set -euo pipefail

GRAFANA_SECRET="4cb2a1c9291071bf6876d6bba28df100cc03414623328ac8f2387756e4a92eb6"

echo "Upgrading Grafana Helm chart with Generic OAuth (Authelia OIDC)..."

helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update prometheus-community

helm upgrade kube-prometheus prometheus-community/kube-prometheus-stack -n monitoring --reuse-values \
  --set grafana.assertNoLeakedSecrets=false \
  --set 'grafana.grafana\.ini.server.root_url=https://grafana.khalilaliouich.com' \
  --set 'grafana.grafana\.ini.auth\.generic_oauth.enabled=true' \
  --set 'grafana.grafana\.ini.auth\.generic_oauth.name=Authelia' \
  --set 'grafana.grafana\.ini.auth\.generic_oauth.allow_sign_up=true' \
  --set 'grafana.grafana\.ini.auth\.generic_oauth.client_id=grafana' \
  --set "grafana.grafana\.ini.auth\.generic_oauth.client_secret=${GRAFANA_SECRET}" \
  --set 'grafana.grafana\.ini.auth\.generic_oauth.scopes=openid profile email groups' \
  --set 'grafana.grafana\.ini.auth\.generic_oauth.auth_url=https://auth.khalilaliouich.com/api/oidc/authorization' \
  --set 'grafana.grafana\.ini.auth\.generic_oauth.token_url=https://auth.khalilaliouich.com/api/oidc/token' \
  --set 'grafana.grafana\.ini.auth\.generic_oauth.api_url=https://auth.khalilaliouich.com/api/oidc/userinfo' \
  --set-string 'grafana.grafana\.ini.auth\.generic_oauth.role_attribute_path=contains(groups[*]\, '\''admins'\'') && '\''Admin'\'' || '\''Viewer'\'''

echo "✅ Grafana successfully configured for Authelia OIDC!"
