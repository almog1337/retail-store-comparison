#!/bin/bash
# Creates the Superset metadata database inside the shared Postgres instance.
# Runs as part of docker-entrypoint-initdb.d (before the retail schema).
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    SELECT 'CREATE DATABASE ${SUPERSET_DB:-superset}'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${SUPERSET_DB:-superset}')\gexec
EOSQL
