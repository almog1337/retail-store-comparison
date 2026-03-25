#!/usr/bin/env bash
set -euo pipefail

DB_CONTAINER=${DB_CONTAINER:-retail-postgres}
DB_USER=${POSTGRES_USER:-postgres}
DB_NAME=${POSTGRES_DB:-retail_store}

# Safety: ensure container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
	echo "Container ${DB_CONTAINER} not running; start with 'docker compose up -d' first." >&2
	exit 1
fi

cat <<'SQL' | docker exec -i "${DB_CONTAINER}" psql -U "${DB_USER}" -d "${DB_NAME}"
INSERT INTO chains (external_id, name)
VALUES
	('7290027600007', 'shufersal'),
	('7290058140886', 'rami_levy')
ON CONFLICT (external_id) DO UPDATE
SET name = EXCLUDED.name;
SQL

echo "Ensured chains exist in ${DB_NAME} on ${DB_CONTAINER}."
