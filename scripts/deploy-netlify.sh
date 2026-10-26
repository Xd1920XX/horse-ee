#!/usr/bin/env bash
# Deploy horse-ee to Netlify with Firebase env vars attached.
# Requires:
#   1) netlify-cli installed (`npm i -g netlify-cli`)
#   2) Logged in: `netlify login`  OR  NETLIFY_AUTH_TOKEN env var set
#   3) Site linked: run `netlify init` once (creates .netlify/state.json)
#   4) .env.local present at repo root with VITE_FIREBASE_* vars

set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .env.local ]; then
  echo "ERROR: .env.local missing. Copy .env.example and fill it in."
  exit 1
fi

# Sync every VITE_* var from .env.local into Netlify site env.
echo "→ Syncing env vars to Netlify..."
while IFS='=' read -r key value; do
  # skip blank lines and comments
  [[ -z "$key" || "$key" == \#* ]] && continue
  # strip surrounding quotes if any
  value=${value%\"}
  value=${value#\"}
  echo "   setting $key"
  netlify env:set "$key" "$value" --context production > /dev/null
done < .env.local

echo "→ Building..."
npm run build

echo "→ Deploying to production..."
netlify deploy --prod --dir=dist
