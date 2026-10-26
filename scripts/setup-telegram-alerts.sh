#!/usr/bin/env bash
# Branche Alertmanager sur un bot Telegram. Lit deux fichiers que tu crees toi-meme
# (ils ne passent ni par le depot ni par la conversation) :
#   ~/.telegram-alert-token    jeton donne par @BotFather
#   ~/.telegram-alert-chat-id  identifiant numerique de ta conversation avec le bot
set -euo pipefail
here="$(cd "$(dirname "$0")/.." && pwd)"
tok_file="${TELEGRAM_TOKEN_FILE:-$HOME/.telegram-alert-token}"
chat_file="${TELEGRAM_CHAT_FILE:-$HOME/.telegram-alert-chat-id}"
tr -d '[:space:]' < "$tok_file" > /dev/shm/tg-token
chat="$(tr -d '[:space:]' < "$chat_file")"
case "$chat" in ''|*[!0-9-]*) echo "identifiant de conversation invalide" >&2; exit 1;; esac

# Le jeton doit etre valide avant de le ranger.
curl -fsS "https://api.telegram.org/bot$(cat /dev/shm/tg-token)/getMe" >/dev/null || { shred -u /dev/shm/tg-token; echo "jeton refuse par Telegram" >&2; exit 1; }

sudo kubectl -n monitoring create secret generic telegram-alerts \
  --from-file=token=/dev/shm/tg-token --dry-run=client -o yaml | sudo kubectl apply -f -
shred -u /dev/shm/tg-token
sed "s/CHAT_ID_PLACEHOLDER/$chat/" "$here/k8s/monitoring/alertmanager-telegram.yaml" | sudo kubectl apply -f -
echo "Alertmanager branche sur Telegram"
