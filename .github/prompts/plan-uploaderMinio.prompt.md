## Plan: Move Uploading to Uploader Service

Shift MinIO upload logic into the uploader service, expose a `POST /minio` endpoint secured with `Authorization: Bearer <key>`, and update the scraper to call that endpoint instead of uploading directly. Preserve the current MinIO key scheme and payload grouping. Add a simple storage abstraction in the uploader so a Postgres backend can be plugged in later without changing the HTTP contract. Keep changes scoped to uploader API, scraper client, and configuration.

**Steps**
1. Add uploader-side storage abstraction (e.g., `StorageBackend` interface + `MinioBackend`) and move the MinIO logic from [monorepo/scraper/uploaders/upload_to_minio.py](monorepo/scraper/uploaders/upload_to_minio.py) into uploader (new module under [monorepo/uploader](monorepo/uploader)). Keep NDJSON formatting and bucket creation behavior.
2. Extend [monorepo/uploader/main.py](monorepo/uploader/main.py) with `POST /minio`, validating auth header and request payload (pipeline name, grouped records, and key path). Route to the MinIO backend via the abstraction so future Postgres upload can be added alongside.
3. Add uploader config for MinIO and API key (env-driven) in [monorepo/uploader/config.py](monorepo/uploader/config.py) and load it in the endpoint.
4. Update scraper pipeline runner to call uploader over HTTP instead of local MinIO upload. Replace the direct call in [monorepo/scraper/pipeline_runner.py](monorepo/scraper/pipeline_runner.py) with a small client that posts the grouped records and key to `POST /minio`, using the same key scheme.
5. Remove or deprecate the scraper’s MinIO uploader module if unused, and adjust imports accordingly.

**Verification**
- Run uploader service and hit `POST /minio` with a sample payload and auth header; confirm object appears in MinIO with the expected key.
- Run scraper pipeline locally; confirm it calls uploader and no longer uses direct S3.
- Optional: add a minimal integration test for the uploader endpoint if tests exist.

**Decisions**
- Use `POST /minio` with `Authorization: Bearer <key>` and JSON body containing the records and key.
- Preserve the existing MinIO key scheme used by the scraper.
