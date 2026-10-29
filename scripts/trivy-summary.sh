#!/usr/bin/env bash
# Lecture rapide des rapports du trivy-operator, sans passer par Grafana.
#   scripts/trivy-summary.sh           # resume du cluster
#   scripts/trivy-summary.sh gitea     # un seul namespace
# Les memes donnees sont dans le tableau de bord Grafana « Security — Trivy Scan Results ».
set -euo pipefail

exec python3 - "${1:-}" <<'PY'
import collections
import json
import subprocess
import sys

ns_filter = sys.argv[1]
scope = ["-n", ns_filter] if ns_filter else ["-A"]


def get(kind):
    out = subprocess.run(["kubectl", "get", kind, *scope, "-o", "json"],
                         capture_output=True, text=True, check=True).stdout
    return json.loads(out)["items"]


vul = get("vulnerabilityreports")
crit, high, total = collections.Counter(), collections.Counter(), collections.Counter()
for r in vul:
    s = r["report"]["summary"]
    art = r["report"]["artifact"]
    key = (r["metadata"]["namespace"], f'{art["repository"]}:{art.get("tag", "?")}')
    crit[key] += s["criticalCount"]
    high[key] += s["highCount"]
    total["Critical"] += s["criticalCount"]
    total["High"] += s["highCount"]

print(f'Vulnerabilites avec correctif : {total["Critical"]} critiques, {total["High"]} hautes ({len(vul)} rapports)')
print("\nImages a mettre a jour en premier (critiques) :")
for key, n in crit.most_common(10):
    if n:
        print(f"  {n:4d}  {key[0]:<14} {key[1]}   (+{high[key]} hautes)")

bad = collections.Counter()
for r in get("configauditreports"):
    s = r["report"]["summary"]
    n = s["criticalCount"] + s["highCount"]
    if n:
        labels = r["metadata"].get("labels", {})
        bad[(r["metadata"]["namespace"], labels.get("trivy-operator.resource.kind", "?"),
             labels.get("trivy-operator.resource.name", "?"))] += n
print("\nMauvaises configurations critiques ou hautes :")
for (ns, kind, name), n in bad.most_common(10):
    print(f"  {n:4d}  {ns:<14} {kind}/{name}")

found = []
for r in get("exposedsecretreports"):
    s = r["report"]["summary"]
    n = s["criticalCount"] + s["highCount"]
    if n:
        found.append((r["metadata"]["namespace"], r["metadata"]["name"], n))
print("\nSecrets exposes dans des images :", "aucun" if not found else "")
for ns, name, n in found:
    print(f"  !! {ns}/{name} : {n}")
PY
