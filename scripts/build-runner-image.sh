#!/usr/bin/env bash
# Construit l'image du runner sur le noeud k3s (meme convention que les autres
# images locales du showroom : imagePullPolicy Never).
set -euo pipefail
here="$(cd "$(dirname "$0")/.." && pwd)"
sudo nerdctl --address /run/k3s/containerd/containerd.sock --namespace k8s.io build -t gitea-runner-ci:v1 "$here/ci/runner"
