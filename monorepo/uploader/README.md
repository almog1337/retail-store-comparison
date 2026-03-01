# Uploader Service

NestJS-based API service for uploading retail price data records to S3-compatible object storage with automatic key generation and partitioning.

## Installation

This project uses pnpm for dependency management:

```bash
pnpm install
```

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required environment variables:

- `UPLOADER_API_KEY` - Bearer token for API authentication
- `S3_BUCKET` - Target bucket name
- `S3_ENDPOINT` - S3-compatible storage endpoint URL
- `S3_ACCESS_KEY` - S3 access credentials
- `S3_SECRET_KEY` - S3 secret credentials
- `S3_REGION` - AWS region (default: us-east-1)

## Running the Service

```bash
# Development mode
pnpm run start:dev

# Production mode
pnpm run build
pnpm run start:prod
```

## API Endpoints

### POST /s3

Upload grouped records to object storage. The service automatically generates a storage key based on the pipeline name and record metadata.

**Authentication:** Bearer token (configured via `UPLOADER_API_KEY`)

**Request Body:**

```json
{
  "pipeline_name": "shufersal",
  "records": [
    {
      "SubChainId": "7290027600007",
      "StoreId": "123",
      "BikoretNo": "456",
      "ItemCode": "7290000000001",
      "ItemName": "Example Item",
      "Price": "9.90"
    }
  ],
  "create_bucket": true
}
```

**Response:**

```json
{
  "status": "uploaded",
  "key": "bronze/shufersal/sub_chain_id=7290027600007/store_id=123/bikoret_no=456/2026-03-01_14-30-45_parsed_records.txt",
  "records": 120
}
```

## Key Generation

Storage keys are automatically generated using Hive-style partitioning:

```
bronze/{pipeline_name}/sub_chain_id={id}/store_id={id}/bikoret_no={id}/{timestamp}_parsed_records.txt
```

**Requirements:**

- All records in a batch must contain `SubChainId`, `StoreId`, and `BikoretNo` fields
- All records must have identical values for these grouping fields (enforced via strict validation)
- Timestamp format: `YYYY-MM-DD_HH-MM-SS`

## Validation

The service performs strict validation on uploaded records:

1. **Pipeline Name:** Must be one of the allowed pipeline names (currently: `shufersal`)
2. **Required Fields:** Every record must include `SubChainId`, `StoreId`, and `BikoretNo`
3. **Non-Empty Values:** Grouping fields cannot be null, undefined, or empty strings
4. **Group Integrity:** All records in a batch must share identical grouping field values

Validation failures return HTTP 400 with detailed error messages.

### Adding New Pipelines

To add support for a new pipeline:

1. Update `src/upload/constants/pipeline-names.constant.ts` to include the new pipeline name
2. Ensure the corresponding scraper implementation exists in the scraper project

Example error when using an invalid pipeline name:

```json
{
  "statusCode": 400,
  "message": ["pipeline_name must be one of the following values: shufersal"],
  "error": "Bad Request"
}
```

## Architecture

- **UploadController** - HTTP endpoint handling and authentication
- **UploadService** - Orchestrates validation, key generation, and storage
- **RecordValidator** - Validates record schema and group integrity
- **KeyGenerator** - Generates storage keys from record metadata
- **S3Service** - S3-compatible storage backend

## Storage Format

Records are stored as newline-delimited JSON (NDJSON):

- Content-Type: `application/x-ndjson`
- Format: One JSON object per line
- Compression: None (can be added via S3 bucket policies)

## Development

```bash
# Run tests
pnpm run test

# Run tests with coverage
pnpm run test:cov

# Lint code
pnpm run lint
```

## Docker

```bash
# Build image
docker build -t uploader-service .

# Run container
docker run -p 8000:8000 --env-file .env uploader-service
```

## API Documentation

Interactive Swagger documentation available at `/api` when the service is running:

```
http://localhost:8000/api
```
