#!/bin/bash
# Cree le Secret qui porte le jeton d'enregistrement du runner Gitea Actions.
# Le jeton est genere par la CLI de Gitea dans son pod et va directement dans le
# Secret : il n'est ni affiche ni ecrit dans le depot, et aucun mot de passe
# admin n'est necessaire (l'acces au cluster suffit).
set -euo pipefail
TOKEN=$(kubectl -n gitea exec deploy/gitea -c gitea -- gitea actions generate-runner-token | tail -n 1 | tr -d '[:space:]')
[ -n "$TOKEN" ] || { echo "jeton vide" >&2; exit 1; }
kubectl -n gitea create secret generic gitea-runner-token --from-literal=token="$TOKEN" \
  --dry-run=client -o yaml | kubectl apply -f - >/dev/null
echo "secret gitea/gitea-runner-token cree"
