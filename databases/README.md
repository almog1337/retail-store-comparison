# Retail Store Database

Postgres 18+ running in Docker with schema management.

## 1. How to Load

Start the database (first time or after stopping):

```bash
docker compose up -d
```

The database automatically initializes with `schema.sql` on first run.

**Connection details:**

- Configured in `.env` file via `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
- Default values: host `localhost`, port `5432`, user `postgres`, password `postgres`, database `retail_store`

**Connect from terminal:**

```bash
docker compose exec db psql -U postgres -d retail_store
```

**Stop the database:**

```bash
docker compose down
```

## 2. How to Change Schema and Rewrite

**Edit the schema:**

1. Open `schema.sql` and make your changes
2. Apply to running database:

```bash
./scripts/reset_db.sh
```

This drops all tables and recreates everything from `schema.sql` (⚠️ deletes all data).

**If you only want to add new tables without losing data:**

```bash
./scripts/apply_schema.sh
```

This runs the schema without dropping existing tables.

## 3. S3-Compatible Data Lake (MinIO in Docker)

This stack also runs MinIO as an S3-compatible store for the data lake.

- Service: `minio` (S3 API on port 9000, console on 9001)
- Credentials: from `.env` (`MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`)
- Default bucket: `MINIO_BUCKET` (created by the `minio-mc` helper container at startup)
- Data path (host volume): Docker volume `minio_data`

### Start services

```bash
docker compose up -d
```

### MinIO console

Open http://localhost:9001 and log in with the credentials from `.env`.

### S3 endpoint and usage

- Endpoint: http://localhost:9000
- Example AWS CLI usage (after `aws configure` with the MinIO creds):

```bash
aws --endpoint-url http://localhost:9000 s3 ls s3://$MINIO_BUCKET
aws --endpoint-url http://localhost:9000 s3 cp ./sample.jsonl s3://$MINIO_BUCKET/bronze/shufersal/ingest_date=2026-01-21/sample.jsonl
```

Recommended layout: `bronze/` (raw), `silver/` (cleaned Parquet/Delta/Iceberg), `gold/` (aggregates). Partition by `ingest_date=YYYY-MM-DD/` and optionally `chain_id=` and `store_id=` for pruning.

## 4. Superset Troubleshooting

If Superset fails during startup with an error like `database "superset" does not exist`, the usual cause is an existing Postgres volume that skipped first-run init scripts.

This stack now includes a one-shot `superset-db-init` service in Compose that creates `SUPERSET_DB` (default: `superset`) if missing, before `superset-init` runs migrations.

If needed, restart the stack:

```bash
docker compose down
docker compose up -d
```

## 5. Superset Backup and Restore

Use these scripts to export/import Superset metadata and saved state:

- Metadata DB (dashboards, charts, datasets, saved queries, DB connections)
- `/app/superset_home`
- `superset_config.py`

### Export backup

```bash
./scripts/export_superset_backup.sh
```

Optional custom destination:

```bash
./scripts/export_superset_backup.sh ./backups/superset_manual
```

### Import backup

```bash
./scripts/import_superset_backup.sh ./backups/superset_YYYYMMDD_HHMMSS
```

If you omit the backup path, the script automatically restores the latest folder from `./backups/superset_*`:

```bash
./scripts/import_superset_backup.sh
```

If no backups are found, it prints a message and exits.

Important:

- Keep the same `SUPERSET_SECRET_KEY` between export and import environments, otherwise stored database passwords in Superset connections may not decrypt.
- Run from the `databases/` directory (or pass paths accordingly).
