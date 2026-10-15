#!/usr/bin/env bash
# Stack de dev compatible Supabase SANS Docker : Postgres local + GoTrue + PostgREST
# + passerelle Node sur :54321 (mêmes chemins /auth/v1 et /rest/v1 que Supabase).
# Sur un poste avec Docker, préférer `pnpm supabase start` (voir README).
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
source "$HERE/env.sh"
LOG="${LOG_DIR:-/tmp/matocha-devstack}"; mkdir -p "$LOG"

pg_isready -h 127.0.0.1 -q || service postgresql start
psql "$DB_URL" -v ON_ERROR_STOP=1 -q -f "$HERE/bootstrap.sql"

pkill -f "$DEVSTACK_DIR/auth/auth" 2>/dev/null || true
pkill -f "$DEVSTACK_DIR/postgrest" 2>/dev/null || true
pkill -f "devstack/gateway.mjs" 2>/dev/null || true

(cd "$DEVSTACK_DIR/auth" && \
  GOTRUE_DB_DRIVER=postgres \
  DATABASE_URL="postgres://supabase_auth_admin:postgres@127.0.0.1:5432/postgres?search_path=auth" \
  GOTRUE_DB_NAMESPACE=auth \
  GOTRUE_API_HOST=127.0.0.1 PORT=9999 \
  API_EXTERNAL_URL=http://127.0.0.1:54321/auth/v1 \
  GOTRUE_SITE_URL="$SITE_URL" GOTRUE_URI_ALLOW_LIST="$SITE_URL/**" \
  GOTRUE_JWT_SECRET="$JWT_SECRET" GOTRUE_JWT_EXP=3600 GOTRUE_JWT_AUD=authenticated \
  GOTRUE_JWT_ADMIN_ROLES=service_role \
  GOTRUE_EXTERNAL_EMAIL_ENABLED=true GOTRUE_MAILER_AUTOCONFIRM=true \
  GOTRUE_DISABLE_SIGNUP=false GOTRUE_MFA_TOTP_ENROLL_ENABLED=true GOTRUE_MFA_TOTP_VERIFY_ENABLED=true \
  nohup ./auth > "$LOG/auth.log" 2>&1 < /dev/null &)

for i in $(seq 1 30); do curl -sf http://127.0.0.1:9999/health >/dev/null && break; sleep 0.5; done
curl -sf http://127.0.0.1:9999/health >/dev/null || { echo "GoTrue n'a pas démarré"; tail -20 "$LOG/auth.log"; exit 1; }

PGRST_DB_URI="postgres://authenticator:postgres@127.0.0.1:5432/postgres" \
PGRST_DB_SCHEMAS=public PGRST_DB_ANON_ROLE=anon PGRST_JWT_SECRET="$JWT_SECRET" \
PGRST_DB_EXTRA_SEARCH_PATH=public,extensions PGRST_SERVER_PORT=3001 PGRST_SERVER_HOST=127.0.0.1 \
PGRST_DB_CHANNEL_ENABLED=true \
nohup "$DEVSTACK_DIR/postgrest" > "$LOG/postgrest.log" 2>&1 < /dev/null &

nohup node "$HERE/gateway.mjs" > "$LOG/gateway.log" 2>&1 < /dev/null &
sleep 1
echo "Stack prête : API http://127.0.0.1:54321 · Postgres $DB_URL · logs $LOG"
