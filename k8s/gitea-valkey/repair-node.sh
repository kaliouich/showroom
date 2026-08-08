#!/usr/bin/env bash
# Reintegre un noeud Valkey qui vient d'etre recree dans le cluster.
#
# Un noeud recree arrive avec une nouvelle IP et un nouvel identifiant. Les
# autres noeuds cherchent encore l'ancienne IP, la marquent "fail", et les
# slots qu'elle portait deviennent injoignables -> Gitea tombe.
#
# Usage : ./repair-node.sh <ordinal 0|1|2>
set -euo pipefail

N="${1:?usage: repair-node.sh <0|1|2>}"
NS=gitea
STS=gitea-valkey-cluster

case "$N" in
  0) SLOTS="0 5460" ;;
  1) SLOTS="5461 10922" ;;
  2) SLOTS="10923 16383" ;;
  *) echo "ordinal invalide: $N" >&2; exit 1 ;;
esac

# Un noeud sain, different de celui qu'on repare, sert de point d'entree.
for c in 0 1 2; do [ "$c" != "$N" ] && HEALTHY=$c && break; done

cli() { kubectl exec -n "$NS" "$STS-$1" -c "$STS" -- \
        sh -c "valkey-cli -a \"\$VALKEY_PASSWORD\" $2"; }

NEW_IP=$(kubectl get pod "$STS-$N" -n "$NS" -o jsonpath='{.status.podIP}')
[ -n "$NEW_IP" ] || { echo "pas d'IP pour $STS-$N" >&2; exit 1; }

DEAD_ID=$(cli "$HEALTHY" "cluster nodes" | awk '$3 ~ /fail/ {print $1}' | head -1)

echo "noeud $N : nouvelle IP $NEW_IP | ancienne identite ${DEAD_ID:-aucune}"

echo "1/3 rattachement au cluster"
cli "$HEALTHY" "cluster meet $NEW_IP 6379"
sleep 8

if [ -n "$DEAD_ID" ]; then
  # Le forget doit passer sur les trois noeuds dans la meme minute, sinon le
  # gossip rediffuse l'ancienne identite.
  echo "2/3 oubli de l'ancienne identite sur les trois noeuds"
  for c in 0 1 2; do cli "$c" "cluster forget $DEAD_ID" || true; done
else
  echo "2/3 rien a oublier"
fi

echo "3/3 reattribution des slots $SLOTS"
cli "$N" "cluster addslotsrange $SLOTS"

sleep 5
cli "$HEALTHY" "cluster info" | head -3
