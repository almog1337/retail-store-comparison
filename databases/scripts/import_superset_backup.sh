#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
DB_DIR=$(cd "${SCRIPT_DIR}/.." && pwd)
COMPOSE_FILE="${DB_DIR}/docker-compose.yml"

DB_CONTAINER=${DB_CONTAINER:-retail-postgres}
SUPERSET_CONTAINER=${SUPERSET_CONTAINER:-superset}

BACKUPS_ROOT="${DB_DIR}/backups"

if [[ $# -ge 1 ]]; then
  BACKUP_DIR=$1
else
  LATEST_BACKUP=$(ls -1dt "${BACKUPS_ROOT}"/superset_* 2>/dev/null | head -n 1 || true)
  if [[ -z "${LATEST_BACKUP}" ]]; then
    echo "No Superset backups found in ${BACKUPS_ROOT}."
    exit 1
  fi
  BACKUP_DIR="${LATEST_BACKUP}"
  echo "No backup path provided. Using latest backup: ${BACKUP_DIR}"
fi

DB_DUMP_FILE="${BACKUP_DIR}/superset_metadata.dump"
HOME_ARCHIVE_FILE="${BACKUP_DIR}/superset_home.tgz"

if [[ ! -f "${DB_DUMP_FILE}" ]]; then
  echo "Missing metadata dump: ${DB_DUMP_FILE}" >&2
  exit 1
fi

if [[ ! -f "${HOME_ARCHIVE_FILE}" ]]; then
  echo "Missing superset home archive: ${HOME_ARCHIVE_FILE}" >&2
  exit 1
fi

echo "Preparing containers for restore..."
docker compose -f "${COMPOSE_FILE}" up -d db superset-redis

# Safety: ensure Postgres container is running.
if ! docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
  echo "Container ${DB_CONTAINER} is not running after compose up." >&2
  exit 1
fi

echo "Stopping Superset app/workers during restore..."
docker compose -f "${COMPOSE_FILE}" stop superset superset-worker superset-worker-beat || true

DB_NAME=$(docker exec "${DB_CONTAINER}" sh -lc 'printf "%s" "${SUPERSET_DB:-superset}"')

echo "Recreating Superset metadata database (${DB_NAME})..."
docker exec -i "${DB_CONTAINER}" sh -lc 'dropdb -U "${POSTGRES_USER}" --if-exists "${SUPERSET_DB:-superset}"'
docker exec -i "${DB_CONTAINER}" sh -lc 'createdb -U "${POSTGRES_USER}" "${SUPERSET_DB:-superset}"'

echo "Restoring metadata dump..."
docker exec -i "${DB_CONTAINER}" sh -lc 'pg_restore -U "${POSTGRES_USER}" -d "${SUPERSET_DB:-superset}" --clean --if-exists --no-owner --no-privileges -' < "${DB_DUMP_FILE}"

echo "Starting Superset container for superset_home restore..."
docker compose -f "${COMPOSE_FILE}" up -d superset

if ! docker ps --format '{{.Names}}' | grep -q "^${SUPERSET_CONTAINER}$"; then
  echo "Container ${SUPERSET_CONTAINER} is not running after compose up." >&2
  exit 1
fi

echo "Restoring /app/superset_home..."
docker cp "${HOME_ARCHIVE_FILE}" "${SUPERSET_CONTAINER}:/tmp/superset_home.tgz"
docker exec "${SUPERSET_CONTAINER}" sh -lc 'mkdir -p /app/superset_home && rm -rf /app/superset_home/* && tar -C /app -xzf /tmp/superset_home.tgz && rm -f /tmp/superset_home.tgz'

echo "Starting Superset workers..."
docker compose -f "${COMPOSE_FILE}" up -d superset-worker superset-worker-beat

echo "Restore completed successfully."
echo "Important: use the same SUPERSET_SECRET_KEY as the backup source; otherwise stored DB passwords may not decrypt."
