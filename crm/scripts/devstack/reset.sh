#!/usr/bin/env bash
# Équivalent de `supabase db reset` pour la stack sans Docker :
# vide le schéma public, rejoue les migrations puis le seed.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
source "$HERE/env.sh"
psql "$DB_URL" -v ON_ERROR_STOP=1 -q <<'SQL'
drop schema if exists public cascade;
drop schema if exists app cascade;
create schema public;
grant usage on schema public to anon, authenticated, service_role;
grant all on schema public to postgres;
delete from auth.users;
SQL
psql "$DB_URL" -v ON_ERROR_STOP=1 -q -f "$HERE/bootstrap.sql"
for f in "$ROOT"/supabase/migrations/*.sql; do
  echo "→ $(basename "$f")"
  psql "$DB_URL" -v ON_ERROR_STOP=1 -q -f "$f"
done
if [ -f "$ROOT/supabase/seed.sql" ]; then
  echo "→ seed.sql"
  psql "$DB_URL" -v ON_ERROR_STOP=1 -q -f "$ROOT/supabase/seed.sql"
fi
# PostgREST doit recharger son cache de schéma
psql "$DB_URL" -q -c "notify pgrst, 'reload schema'"
echo "Base réinitialisée."
