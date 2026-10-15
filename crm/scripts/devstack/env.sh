# Variables communes de la stack de dev (valeurs de démo publiques de Supabase local).
export DEVSTACK_DIR="${DEVSTACK_DIR:-/opt/devstack}"
export JWT_SECRET="super-secret-jwt-token-with-at-least-32-characters-long"
export DB_URL="postgres://postgres:postgres@127.0.0.1:5432/postgres"
export SITE_URL="http://localhost:3000"
