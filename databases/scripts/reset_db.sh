#!/usr/bin/env bash
set -euo pipefail

DB_CONTAINER=${DB_CONTAINER:-retail-postgres}
DB_USER=${DB_USER:-postgres}
DB_NAME=${DB_NAME:-retail_store}
SCHEMA_FILE=${SCHEMA_FILE:-../schema.sql}

# Safety: ensure container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
  echo "Container ${DB_CONTAINER} not running; start with 'docker compose up -d' first." >&2
  exit 1
fi

# Drop and recreate public schema, then reapply schema.sql
cat <<'SQL' | docker exec -i "${DB_CONTAINER}" psql -U "${DB_USER}" -d "${DB_NAME}"
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO public;
SQL

docker exec -i "${DB_CONTAINER}" psql -U "${DB_USER}" -d "${DB_NAME}" < "${SCHEMA_FILE}"
echo "Database ${DB_NAME} reset from ${SCHEMA_FILE} in ${DB_CONTAINER}."
