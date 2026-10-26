#!/usr/bin/env bash
# Met en place la chaine de build sans privilege : namespace ci-builds, ses
# droits et ses Secrets, puis le runner. Aucune valeur de jeton n'est affichee.
#
# Prerequis : jetons crees par gitea_bootstrap (Secret argocd/repo-tamagotchi-service
# pour la lecture, ~/.gitea-ci-token pour l'ecriture), scripts/register-gitea-runner.sh
# deja execute, image construite par scripts/build-runner-image.sh.
set -euo pipefail
here="$(cd "$(dirname "$0")/.." && pwd)"
registry="gitea-http.gitea.svc.cluster.local:3000"

sudo kubectl apply -f "$here/k8s/gitea/networkpolicy.yaml"
sudo kubectl apply -f "$here/k8s/gitea/ci-builds.yaml"

# Clone : jeton en lecture seule (celui d'ArgoCD).
user="$(sudo kubectl -n argocd get secret repo-tamagotchi-service -o jsonpath='{.data.username}' | base64 -d)"
pass="$(sudo kubectl -n argocd get secret repo-tamagotchi-service -o jsonpath='{.data.password}' | base64 -d)"
sudo kubectl -n ci-builds create secret generic ci-git \
  --from-literal=username="$user" --from-literal=password="$pass" \
  --dry-run=client -o yaml | sudo kubectl apply -f -

# Registre : jeton d'ecriture, au format config.json de Kaniko.
tok="$(cat "$HOME/.gitea-ci-token")"
auth="$(printf '%s:%s' "$user" "$tok" | base64 -w0)"
printf '{"auths":{"%s":{"auth":"%s"}}}' "$registry" "$auth" > /dev/shm/ci-registry.json
sudo kubectl -n ci-builds create secret generic ci-registry \
  --from-file=config.json=/dev/shm/ci-registry.json \
  --dry-run=client -o yaml | sudo kubectl apply -f -
shred -u /dev/shm/ci-registry.json

sudo kubectl apply -f "$here/k8s/gitea/act-runner.yaml"
echo "ci-builds et runner en place"
