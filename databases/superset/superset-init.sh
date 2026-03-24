#!/bin/bash
set -eo pipefail

echo "Running Superset DB migrations..."
superset db upgrade

echo "Creating admin user (skips if already exists)..."
superset fab create-admin \
  --username "${SUPERSET_ADMIN_USERNAME:-admin}" \
  --firstname "Admin" \
  --lastname "User" \
  --email "${SUPERSET_ADMIN_EMAIL:-admin@superset.local}" \
  --password "${SUPERSET_ADMIN_PASSWORD:-admin}" || true

echo "Initializing Superset roles & permissions..."
superset init

echo "Superset initialization complete."
