#!/usr/bin/env bash
# Met a jour Gitea quand le depot demande une autre version que celle qui tourne.
# Les versions viennent du depot (chart : infra/ansible/group_vars/all.yml,
# image : k8s/gitea/values.yaml), que Renovate tient a jour.
#
#   scripts/upgrade-gitea.sh --check   dit ce qui changerait, ne touche a rien
#   scripts/upgrade-gitea.sh           sauvegarde, met a jour, verifie, annule si ca casse
#   scripts/upgrade-gitea.sh --force   idem meme si les versions sont identiques
#                                      (changement de configuration dans values.yaml)
#
# Gitea est expose sur Internet : un correctif de securite doit etre applique
# en jours, pas en mois (incident 12, 60 jours de retard).
set -euo pipefail
[ "$(id -u)" = 0 ] || exec sudo -E "$0" "$@"

here="$(cd "$(dirname "$0")/.." && pwd)"
export KUBECONFIG="${KUBECONFIG:-/etc/rancher/k3s/k3s.yaml}"
backup_dir="${GITEA_BACKUP_DIR:-/var/backups/gitea}"
mode="${1:-apply}"

want_chart="$(python3 -I -c "import yaml,sys;print(yaml.safe_load(open(sys.argv[1]))['versions']['gitea'])" "$here/infra/ansible/group_vars/all.yml")"
want_tag="$(python3 -I -c "import yaml,sys;print(yaml.safe_load(open(sys.argv[1]))['image']['tag'])" "$here/k8s/gitea/values.yaml")"
have_chart="$(helm -n gitea list -o json | jq -r '.[] | select(.name=="gitea") | .chart | sub("gitea-";"")')"
have_tag="$(kubectl -n gitea get deploy gitea -o jsonpath='{.spec.template.spec.containers[?(@.name=="gitea")].image}' | sed 's/.*://; s/-rootless$//')"

echo "chart : en place $have_chart, voulu $want_chart"
echo "image : en place $have_tag, voulue $want_tag"
if [ "$mode" != "--force" ] && [ "$have_chart" = "$want_chart" ] && [ "$have_tag" = "$want_tag" ]; then
  echo "rien a faire"; exit 0
fi
[ "$mode" = "--check" ] && { echo "mise a jour necessaire"; exit 0; }

# 1. Sauvegarde : base et depots, avant de toucher a quoi que ce soit.
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
umask 077
mkdir -p "$backup_dir"
kubectl -n gitea exec gitea-postgresql-0 -c postgresql -- sh -c \
  'PGPASSWORD="$(cat "$POSTGRES_PASSWORD_FILE")" pg_dump -U "$POSTGRES_USER" "$POSTGRES_DATABASE"' \
  | gzip > "$backup_dir/gitea-db-$stamp.sql.gz"
kubectl -n gitea exec deploy/gitea -c gitea -- tar czf - -C /data git \
  > "$backup_dir/gitea-repos-$stamp.tar.gz"
find "$backup_dir" -name 'gitea-*' -mtime +30 -delete
echo "sauvegarde : $backup_dir/*-$stamp.*"

# 2. Mise a jour. --atomic annule la release si le deploiement n'est pas sain.
helm repo add gitea-charts https://dl.gitea.com/charts/ >/dev/null 2>&1 || true
helm repo update gitea-charts >/dev/null
helm upgrade gitea gitea-charts/gitea --version "$want_chart" -n gitea \
  -f "$here/k8s/gitea/values.yaml" --atomic --timeout 20m

# 3. Verification : l'application repond, pas seulement le pod.
kubectl -n gitea rollout status deploy/gitea --timeout=5m
curl -fsS --max-time 20 https://git.khalilaliouich.com/api/healthz >/dev/null
echo "Gitea $want_tag en place"
