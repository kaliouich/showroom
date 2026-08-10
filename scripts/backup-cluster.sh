#!/usr/bin/env bash
# Sauvegarde du cluster k3s vers OCI Object Storage.
#
# Contenu de l'archive :
#   - state.db     : la base k3s (SQLite), copiee a chaud via sqlite3 .backup
#   - dumps SQL    : gitea, tamagotchi, habit-game (pg_dump, coherent)
#   - volumes      : les PV local-path + les donnees Grafana
#   - manifestes   : tous les objets du cluster, pour reconstruire a l'identique
#
# Retention : seule la sauvegarde la plus recente est conservee dans le bucket
# (RETENTION=1). Rien n'est laisse sur le disque local : le repertoire de
# travail est supprime en sortie, y compris en cas d'erreur.
set -euo pipefail

BUCKET="${BUCKET:-showroom-backups}"
RETENTION="${RETENTION:-1}"
OCI_BIN="${OCI_BIN:-/home/ubuntu/.local/bin/oci}"
OCI_CONFIG="${OCI_CONFIG:-/home/ubuntu/.oci/config}"
KUBECONFIG_PATH="${KUBECONFIG_PATH:-/etc/rancher/k3s/k3s.yaml}"

STAMP="$(date -u +%Y-%m-%dT%H-%M-%SZ)"
ARCHIVE="cluster-${STAMP}.tar.zst"
WORK="$(mktemp -d /var/tmp/k3s-backup.XXXXXX)"
trap 'rm -rf "$WORK"' EXIT

export KUBECONFIG="$KUBECONFIG_PATH"
log() { echo "[$(date -u +%H:%M:%S)] $*"; }

log "1/5 base k3s"
mkdir -p "$WORK/k3s"
DB=/var/lib/rancher/k3s/server/db/state.db
if command -v sqlite3 >/dev/null; then
  # .backup prend un verrou coherent, contrairement a un cp sur une base vivante
  sqlite3 "$DB" ".backup '$WORK/k3s/state.db'"
else
  cp "$DB" "$WORK/k3s/state.db"
fi
cp /var/lib/rancher/k3s/server/token "$WORK/k3s/token"

log "2/5 dumps PostgreSQL"
mkdir -p "$WORK/postgres"
dump() { # <ns> <pod> <conteneur> <user> <db> <fichier>
  [ -n "$2" ] || { echo "  !! pod introuvable pour $6"; return; }
  # Le mot de passe est tantot dans une variable, tantot dans un fichier
  # (chart Bitnami) : on resout les deux cas dans le conteneur.
  kubectl exec -n "$1" "$2" -c "$3" -- sh -c \
    "PGPASSWORD=\"\${POSTGRES_PASSWORD:-\$(cat \${POSTGRES_PASSWORD_FILE:-/dev/null} 2>/dev/null)}\" \
     pg_dump -U $4 -d $5" \
    > "$WORK/postgres/$6.sql" 2>/dev/null \
    && echo "  $6.sql ($(du -h "$WORK/postgres/$6.sql" | cut -f1))" \
    || { echo "  !! dump $6 echoue"; rm -f "$WORK/postgres/$6.sql"; }
}
dump gitea      gitea-postgresql-0 postgresql gitea      gitea      gitea
dump tamagotchi "$(kubectl get pod -n tamagotchi -l app=postgres -o name 2>/dev/null | head -1 | cut -d/ -f2)" \
                postgres tamagotchi tamagotchi tamagotchi
dump default    "$(kubectl get pod -n default -l app=habit-postgres -o name 2>/dev/null | head -1 | cut -d/ -f2)" \
                postgres habit habitgame habit

log "3/5 volumes"
mkdir -p "$WORK/volumes"
[ -d /data/oci-bv-100gb ] && tar -C /data -cf "$WORK/volumes/local-path.tar" oci-bv-100gb
[ -d /var/lib/showcase ] && tar -C /var/lib -cf "$WORK/volumes/showcase.tar" showcase

log "4/5 manifestes"
mkdir -p "$WORK/manifests"
kubectl get all,cm,secret,pvc,pv,ingress,httproute,gateway,sc,limitrange,pdb \
  -A -o yaml > "$WORK/manifests/all.yaml" 2>/dev/null || true
kubectl get crd -o yaml > "$WORK/manifests/crd.yaml" 2>/dev/null || true

log "5/5 archivage et envoi"
# L'archive est ecrite hors de $WORK, sinon tar se lit lui-meme en cours
# d'ecriture et sort en erreur.
OUT="$(mktemp -d /var/tmp/k3s-archive.XXXXXX)"
trap 'rm -rf "$WORK" "$OUT"' EXIT
tar -C "$WORK" -c . | zstd -q -3 -o "$OUT/$ARCHIVE"
SIZE=$(du -h "$OUT/$ARCHIVE" | cut -f1)

OCI_CLI_CONFIG_FILE="$OCI_CONFIG" "$OCI_BIN" os object put \
  --bucket-name "$BUCKET" --file "$OUT/$ARCHIVE" --name "$ARCHIVE" \
  --force >/dev/null

# La purge n'a lieu qu'apres un envoi reussi : en cas d'echec, la sauvegarde
# precedente reste en place.
OLD=$(OCI_CLI_CONFIG_FILE="$OCI_CONFIG" "$OCI_BIN" os object list \
        --bucket-name "$BUCKET" --query 'data[].name' --raw-output 2>/dev/null \
      | python3 -c "import json,sys; print('\n'.join(sorted(json.load(sys.stdin), reverse=True)))" \
      | tail -n +$((RETENTION + 1)))

for o in $OLD; do
  OCI_CLI_CONFIG_FILE="$OCI_CONFIG" "$OCI_BIN" os object delete \
    --bucket-name "$BUCKET" --object-name "$o" --force >/dev/null && echo "  purge $o"
done

log "OK $ARCHIVE ($SIZE) -> $BUCKET"
