#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
DB_DIR=$(cd "${SCRIPT_DIR}/.." && pwd)
COMPOSE_FILE="${DB_DIR}/docker-compose.yml"

DB_CONTAINER=${DB_CONTAINER:-retail-postgres}
SUPERSET_CONTAINER=${SUPERSET_CONTAINER:-superset}

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DEFAULT_BACKUP_DIR="${DB_DIR}/backups/superset_${TIMESTAMP}"
BACKUP_DIR=${1:-${DEFAULT_BACKUP_DIR}}

mkdir -p "${BACKUP_DIR}"

echo "Creating Superset backup in: ${BACKUP_DIR}"

# Safety: ensure required containers are running.
if ! docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
  echo "Container ${DB_CONTAINER} is not running. Start services with 'docker compose -f ${COMPOSE_FILE} up -d'." >&2
  exit 1
fi

if ! docker ps --format '{{.Names}}' | grep -q "^${SUPERSET_CONTAINER}$"; then
  echo "Container ${SUPERSET_CONTAINER} is not running. Start services with 'docker compose -f ${COMPOSE_FILE} up -d'." >&2
  exit 1
fi

DB_NAME=$(docker exec "${DB_CONTAINER}" sh -lc 'printf "%s" "${SUPERSET_DB:-superset}"')
DB_DUMP_FILE="${BACKUP_DIR}/superset_metadata.dump"
HOME_ARCHIVE_FILE="${BACKUP_DIR}/superset_home.tgz"
MANIFEST_FILE="${BACKUP_DIR}/manifest.txt"

echo "Exporting Superset metadata database (${DB_NAME})..."
docker exec -i "${DB_CONTAINER}" sh -lc 'pg_dump -Fc -U "${POSTGRES_USER}" -d "${SUPERSET_DB:-superset}"' > "${DB_DUMP_FILE}"

echo "Archiving /app/superset_home from ${SUPERSET_CONTAINER}..."
docker exec "${SUPERSET_CONTAINER}" sh -lc 'tar -C /app -czf /tmp/superset_home.tgz superset_home'
docker cp "${SUPERSET_CONTAINER}:/tmp/superset_home.tgz" "${HOME_ARCHIVE_FILE}"
docker exec "${SUPERSET_CONTAINER}" sh -lc 'rm -f /tmp/superset_home.tgz'

# Keep a copy of runtime config used by the Superset containers.
cp "${DB_DIR}/superset/superset_config.py" "${BACKUP_DIR}/superset_config.py"

# Optional env snapshot (filtered keys) to help restore in another environment.
if [[ -f "${DB_DIR}/../.env" ]]; then
  grep -E '^(SUPERSET_|POSTGRES_|DATABASE_|REDIS_)' "${DB_DIR}/../.env" > "${BACKUP_DIR}/env.superset.snapshot" || true
fi

cat > "${MANIFEST_FILE}" <<EOF
backup_created_at=${TIMESTAMP}
compose_file=${COMPOSE_FILE}
db_container=${DB_CONTAINER}
superset_container=${SUPERSET_CONTAINER}
superset_db_name=${DB_NAME}
files:
  - superset_metadata.dump
  - superset_home.tgz
  - superset_config.py
  - env.superset.snapshot (optional)
notes:
  - Restore requires matching SUPERSET_SECRET_KEY for encrypted connection passwords.
  - Metadata dump contains dashboards, charts, datasets, saved queries, and DB connections.
EOF

echo "Backup completed successfully."
echo "Created files:"
ls -1 "${BACKUP_DIR}"
