#!/bin/bash
set -euo pipefail

echo "=========================================="
echo "🔐 Authelia SSO Deployment"
echo "=========================================="

echo "1. Creating namespace auth..."
kubectl create namespace auth --dry-run=client -o yaml | kubectl apply -f -

echo "2. Generating RSA Private Key for OIDC..."
openssl genrsa -out oidc_private.pem 4096

echo "3. Generating Authelia Secrets..."
JWT_SECRET=$(openssl rand -hex 64)
SESSION_SECRET=$(openssl rand -hex 64)
STORAGE_KEY=$(openssl rand -hex 64)
HMAC_SECRET=$(openssl rand -hex 64)

# Client Secrets for OIDC
GRAFANA_SECRET=$(openssl rand -hex 32)
ARGOCD_SECRET=$(openssl rand -hex 32)
GITEA_SECRET=$(openssl rand -hex 32)

echo "4. Hashing Passwords with Authelia Crypto..."
# Note: Authelia docker container can be used to generate hashes
docker pull authelia/authelia:4.38
ADMIN_HASH=$(docker run --rm authelia/authelia:4.38 authelia crypto hash generate argon2 --password "admin2026" | awk '/Digest:/ {print $2}')
GUEST_HASH=$(docker run --rm authelia/authelia:4.38 authelia crypto hash generate argon2 --password "visitor2026" | awk '/Digest:/ {print $2}')

# Update the ConfigMap locally (or remotely) with the generated hashes
# For simplicity, we just inject it dynamically here
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ConfigMap
metadata:
  name: authelia-config
  namespace: auth
data:
  configuration.yml: |
    theme: dark
    default_2fa_method: ''
    server:
      host: 0.0.0.0
      port: 9091
    log:
      level: info
    identity_providers:
      oidc:
        cors:
          endpoints:
            - authorization
            - token
            - revokation
            - introspection
            - userinfo
          allowed_origins:
            - https://grafana.khalilaliouich.com
            - https://argocd.khalilaliouich.com
            - https://git.khalilaliouich.com
          allowed_origins_from_client_redirect_uris: true
        clients:
          - id: grafana
            description: Grafana
            secret: "\${AUTHELIA_IDENTITY_PROVIDERS_OIDC_CLIENTS_GRAFANA_SECRET}"
            public: false
            authorization_policy: bypass
            redirect_uris:
              - https://grafana.khalilaliouich.com/login/generic_oauth
            scopes:
              - openid
              - profile
              - groups
              - email
            userinfo_signing_algorithm: none
          - id: argocd
            description: ArgoCD
            secret: "\${AUTHELIA_IDENTITY_PROVIDERS_OIDC_CLIENTS_ARGOCD_SECRET}"
            public: false
            authorization_policy: bypass
            redirect_uris:
              - https://argocd.khalilaliouich.com/auth/callback
            scopes:
              - openid
              - profile
              - groups
              - email
            userinfo_signing_algorithm: none
          - id: gitea
            description: Gitea
            secret: "\${AUTHELIA_IDENTITY_PROVIDERS_OIDC_CLIENTS_GITEA_SECRET}"
            public: false
            authorization_policy: bypass
            redirect_uris:
              - https://git.khalilaliouich.com/user/oauth2/authelia/callback
            scopes:
              - openid
              - profile
              - groups
              - email
            userinfo_signing_algorithm: none
    authentication_backend:
      file:
        path: /config/users_database.yml
    access_control:
      default_policy: bypass
      rules:
        - domain: auth.khalilaliouich.com
          policy: bypass
    session:
      name: authelia_session
      expiration: 3600
      inactivity: 300
      domain: khalilaliouich.com
    storage:
      local:
        path: /var/lib/authelia/db.sqlite3
    notifier:
      filesystem:
        filename: /var/lib/authelia/emails.txt

  users_database.yml: |
    users:
      admin:
        displayname: "Admin User"
        password: "${ADMIN_HASH}"
        email: admin@khalilaliouich.com
        groups:
          - admins
      guest:
        displayname: "Visitor"
        password: "${GUEST_HASH}"
        email: guest@khalilaliouich.com
        groups:
          - viewers
EOF

echo "5. Creating Kubernetes Secret..."
kubectl create secret generic authelia-secrets -n auth \
  --from-literal=jwt_secret="${JWT_SECRET}" \
  --from-literal=session_secret="${SESSION_SECRET}" \
  --from-literal=storage_encryption_key="${STORAGE_KEY}" \
  --from-literal=oidc_hmac_secret="${HMAC_SECRET}" \
  --from-file=oidc_issuer_private_key=oidc_private.pem \
  --from-literal=oidc_client_grafana_secret="${GRAFANA_SECRET}" \
  --from-literal=oidc_client_argocd_secret="${ARGOCD_SECRET}" \
  --from-literal=oidc_client_gitea_secret="${GITEA_SECRET}" \
  --dry-run=client -o yaml | kubectl apply -f -

rm oidc_private.pem

echo "✅ Authelia Secrets & ConfigMap generated and applied."

# Print the cleartext OIDC secrets so we can use them to configure ArgoCD, Gitea, Grafana later
echo ""
echo "=========================================="
echo "📝 OIDC Client Secrets (Save These)"
echo "Grafana: ${GRAFANA_SECRET}"
echo "ArgoCD : ${ARGOCD_SECRET}"
echo "Gitea  : ${GITEA_SECRET}"
echo "=========================================="
