#!/bin/bash
set -euo pipefail

GITEA_SECRET="58518cf7f09632dc136baa2a1f71bea2896482c669895d9544928bb7ba1682b4"

echo "Adding Authelia OIDC Provider to Gitea via CLI..."

GITEA_POD=$(kubectl -n gitea get pods -l app=gitea -o jsonpath='{.items[0].metadata.name}')

kubectl -n gitea exec $GITEA_POD -c gitea -- su git -c "/usr/local/bin/gitea admin auth add-oauth --name Authelia --provider openidConnect --key gitea --secret ${GITEA_SECRET} --auto-discover-url https://auth.khalilaliouich.com/.well-known/openid-configuration --group-team-map '{\"admins\":{\"khalil\":[\"Owners\"]}}'" || echo "Gitea Auth provider might already exist."

echo "✅ Gitea successfully configured for Authelia OIDC!"
