#!/usr/bin/env bash
# Restaure les donnees depuis la derniere sauvegarde presente dans OCI
# Object Storage : volumes, bases PostgreSQL, et secrets du cluster.
#
# A lancer APRES install-platform.sh, sur une plateforme deja debout.
#
# Ce script ecrase des donnees. Il demande confirmation, sauf avec --yes.
set -euo pipefail

export KUBECONFIG=/etc/rancher/k3s/k3s.yaml
source /etc/showroom.env 2>/dev/null || true
BUCKET="${BACKUP_BUCKET:-showroom-backups}"
OCI_BIN="${OCI_BIN:-/home/ubuntu/.local/bin/oci}"
OCI_CONFIG="${OCI_CONFIG:-/home/ubuntu/.oci/config}"
ASSUME_YES="${1:-}"

WORK="$(mktemp -d /var/tmp/restore.XXXXXX)"
trap 'rm -rf "$WORK"' EXIT
oci_() { OCI_CLI_CONFIG_FILE="$OCI_CONFIG" "$OCI_BIN" "$@"; }

echo "=== derniere sauvegarde disponible ==="
ARCHIVE=$(oci_ os object list --bucket-name "$BUCKET" --query 'data[].name' --raw-output \
  | python3 -c "import json,sys; l=json.load(sys.stdin); print(sorted(l)[-1] if l else '')")
[ -n "$ARCHIVE" ] || { echo "bucket $BUCKET vide : rien a restaurer"; exit 1; }
echo "  $ARCHIVE"

if [ "$ASSUME_YES" != "--yes" ]; then
  read -r -p "Ecraser les donnees actuelles avec cette sauvegarde ? [oui/non] " a
  [ "$a" = "oui" ] || { echo "abandon"; exit 1; }
fi

echo "=== telechargement et ouverture ==="
oci_ os object get --bucket-name "$BUCKET" --name "$ARCHIVE" --file "$WORK/a.tar.zst" >/dev/null
zstd -dc "$WORK/a.tar.zst" | tar -C "$WORK" -xf -

echo "=== volumes ==="
# Les pods sont arretes pendant la copie : restaurer sous un PostgreSQL vivant
# donnerait une base incoherente.
kubectl scale deploy,statefulset --all --replicas=0 -n gitea 2>/dev/null || true
kubectl scale deploy,statefulset --all --replicas=0 -n tamagotchi 2>/dev/null || true
kubectl scale deploy --all --replicas=0 -n default 2>/dev/null || true
sleep 20

[ -f "$WORK/volumes/local-path.tar" ] && tar -C /data -xf "$WORK/volumes/local-path.tar"
[ -f "$WORK/volumes/showcase.tar" ]   && tar -C /var/lib -xf "$WORK/volumes/showcase.tar"

kubectl scale deploy,statefulset --all --replicas=1 -n gitea 2>/dev/null || true
kubectl scale deploy,statefulset --all --replicas=1 -n tamagotchi 2>/dev/null || true
kubectl scale deploy --all --replicas=1 -n default 2>/dev/null || true

echo "=== attente des bases ==="
kubectl -n gitea rollout status statefulset/gitea-postgresql --timeout=600s || true
sleep 15

echo "=== bases PostgreSQL ==="
restore_db() { # <ns> <pod> <conteneur> <user> <db> <fichier>
  [ -f "$WORK/postgres/$6.sql" ] || { echo "  $6 : absent de la sauvegarde"; return; }
  kubectl exec -i -n "$1" "$2" -c "$3" -- sh -c \
    "PGPASSWORD=\"\${POSTGRES_PASSWORD:-\$(cat \${POSTGRES_PASSWORD_FILE:-/dev/null} 2>/dev/null)}\" \
     psql -U $4 -d $5" < "$WORK/postgres/$6.sql" >/dev/null 2>&1 \
    && echo "  $6 restauree" || echo "  !! $6 en echec"
}
restore_db gitea gitea-postgresql-0 postgresql gitea gitea gitea
restore_db tamagotchi "$(kubectl get pod -n tamagotchi -l app=postgres -o name | head -1 | cut -d/ -f2)" \
           postgres tamagotchi tamagotchi tamagotchi
restore_db default "$(kubectl get pod -n default -l app=habit-postgres -o name | head -1 | cut -d/ -f2)" \
           postgres habit habitgame habit

echo "=== secrets ==="
# Mots de passe ArgoCD et Gitea, cles de session, comptes visiteurs : sans eux
# la plateforme fonctionne mais personne ne peut s'y connecter.
python3 - "$WORK/manifests/all.yaml" <<'PY' > "$WORK/secrets.yaml" || true
import sys, yaml
docs = yaml.safe_load(open(sys.argv[1]))
out = []
for item in (docs.get('items') or []):
    if item.get('kind') != 'Secret':
        continue
    t = item.get('type', '')
    # Les secrets de ServiceAccount et les certificats sont regeneres par le
    # cluster : les reinjecter provoquerait des conflits.
    if t in ('kubernetes.io/service-account-token', 'helm.sh/release.v1'):
        continue
    m = item['metadata']
    for f in ('creationTimestamp','resourceVersion','uid','managedFields','ownerReferences'):
        m.pop(f, None)
    out.append(item)
print(yaml.safe_dump_all(out))
PY
kubectl apply -f "$WORK/secrets.yaml" 2>/dev/null | tail -3 || echo "  aucun secret reinjecte"

echo
echo "=== restauration terminee ==="
kubectl get pods -A --no-headers | grep -vE "Running|Completed" || echo "tous les pods sont sains"
echo
echo "Verifier ensuite :"
echo "  - les depots dans Gitea"
echo "  - la connexion ArgoCD"
echo "  - l'emission du certificat : kubectl get certificate -A"
