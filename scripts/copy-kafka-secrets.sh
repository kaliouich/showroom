#!/bin/bash
# Copie les secrets Strimzi (generes dans le ns kafka) vers le ns tamagotchi,
# sans jamais afficher leur contenu : un KafkaUser et le CA du cluster ne sont
# lisibles que dans leur namespace d'origine.
set -euo pipefail
copy() { # $1 = secret source, $2 = nom cible, $3.. = cles a copier
  src=$1; dst=$2; shift 2
  kubectl -n kafka get secret "$src" -o json | python3 -I -c '
import json,sys
keys=sys.argv[2:]
s=json.load(sys.stdin)
out={"apiVersion":"v1","kind":"Secret","type":"Opaque",
     "metadata":{"name":sys.argv[1],"namespace":"tamagotchi",
                 "labels":{"app.kubernetes.io/managed-by":"manual-copy-from-kafka-ns"}},
     "data":{k:s["data"][k] for k in keys}}
print(json.dumps(out))' "$dst" "$@" | kubectl apply -f - >/dev/null
  echo "copied $src -> tamagotchi/$dst"
}
copy tamagotchi-producer kafka-producer-credentials password
copy showroom-cluster-ca-cert kafka-cluster-ca ca.crt
