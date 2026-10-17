#!/usr/bin/env bash
set -e

# Nils-o-mat Sicheres Deployment-Skript (Mac -> Server)
# Schließt .env und persistenten Zustand (data/) strikt aus

REMOTE_TARGET="${1:-ubuntu@novalis:/srv/docker/nilsomat/}"

echo "==> Synchronisiere Repository mit ${REMOTE_TARGET}..."
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude 'dist' \
  --exclude '.git' \
  --exclude 'data' \
  --exclude '.env*' \
  ./ "${REMOTE_TARGET}"

echo "==> Baue Container und starte neu auf novalis..."
ssh "${REMOTE_TARGET%%:*}" "cd ${REMOTE_TARGET##*:} && docker compose build && docker compose up -d"

echo "==> Nils-o-mat erfolgreich bereitgestellt!"
