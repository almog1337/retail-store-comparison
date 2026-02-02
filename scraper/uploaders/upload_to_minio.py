"""
Upload a local file to the MinIO S3-compatible data lake.

Defaults read from environment:
- MINIO_ENDPOINT (default: http://localhost:9000)
- MINIO_ACCESS_KEY (default: admin)
- MINIO_SECRET_KEY (default: admin12345)
- MINIO_BUCKET (default: retail-price-datalake)

Example:
python upload_to_minio.py \
  --file ../parsed_records.json \
  --key bronze/shufersal/ingest_date=2026-01-21/parsed_records.json
"""

import argparse
import os
from pathlib import Path
from typing import Optional

import boto3
from botocore.client import Config
from botocore.exceptions import ClientError


def ensure_bucket(s3_client, bucket: str) -> None:
    """Create bucket if it does not exist."""
    try:
        s3_client.head_bucket(Bucket=bucket)
    except ClientError as exc:  # bucket missing
        error_code = int(exc.response.get("Error", {}).get("Code", 0))
        if error_code in (404, 301, 400):
            s3_client.create_bucket(Bucket=bucket)
        else:
            raise


def upload_data_to_minio(
    data: list,
    key: str,
    bucket: Optional[str] = None,
    endpoint: Optional[str] = None,
    access_key: Optional[str] = None,
    secret_key: Optional[str] = None,
    region: str = "us-east-1",
    create_bucket: bool = False,
) -> None:
    """Upload data directly to MinIO (S3-compatible) as NDJSON."""
    bucket = bucket or os.environ.get("MINIO_BUCKET", "retail-price-datalake")
    endpoint = endpoint or os.environ.get("MINIO_ENDPOINT", "http://localhost:9000")
    access_key = access_key or os.environ.get("MINIO_ACCESS_KEY", os.environ.get("MINIO_ROOT_USER", "admin"))
    secret_key = secret_key or os.environ.get("MINIO_SECRET_KEY", os.environ.get("MINIO_ROOT_PASSWORD", "admin12345"))

    s3 = boto3.client(
        "s3",
        endpoint_url=endpoint,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name=region,
        config=Config(signature_version="s3v4"),
    )

    if create_bucket:
        ensure_bucket(s3, bucket)

    # Convert data to NDJSON format
    ndjson_content = "\n".join(str(record) for record in data)

    s3.put_object(Bucket=bucket, Key=key, Body=ndjson_content.encode("utf-8"))
    print(f"Uploaded data to s3://{bucket}/{key}")


def upload_file_to_minio(
    file_path: Path,
    key: str,
    bucket: Optional[str] = None,
    endpoint: Optional[str] = None,
    access_key: Optional[str] = None,
    secret_key: Optional[str] = None,
    region: str = "us-east-1",
    create_bucket: bool = False,
) -> None:
    """Upload a file to MinIO (S3-compatible)."""
    bucket = bucket or os.environ.get("MINIO_BUCKET", "retail-price-datalake")
    endpoint = endpoint or os.environ.get("MINIO_ENDPOINT", "http://localhost:9000")
    access_key = access_key or os.environ.get("MINIO_ACCESS_KEY", os.environ.get("MINIO_ROOT_USER", "admin"))
    secret_key = secret_key or os.environ.get("MINIO_SECRET_KEY", os.environ.get("MINIO_ROOT_PASSWORD", "admin12345"))

    s3 = boto3.client(
        "s3",
        endpoint_url=endpoint,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name=region,
        config=Config(signature_version="s3v4"),
    )

    if create_bucket:
        ensure_bucket(s3, bucket)

    s3.upload_file(str(file_path), bucket, key)
    print(f"Uploaded {file_path} to s3://{bucket}/{key}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Upload file to MinIO")
    parser.add_argument("--file", required=True, help="Local file path to upload")
    parser.add_argument(
        "--key",
        required=True,
        help="Destination object key (path inside bucket, e.g., bronze/.../file.jsonl)",
    )
    parser.add_argument(
        "--bucket",
        default=os.environ.get("MINIO_BUCKET", "retail-price-datalake"),
        help="Target bucket name",
    )
    parser.add_argument(
        "--endpoint",
        default=os.environ.get("MINIO_ENDPOINT", "http://localhost:9000"),
        help="MinIO endpoint URL",
    )
    parser.add_argument(
        "--access-key",
        default=os.environ.get("MINIO_ACCESS_KEY", os.environ.get("MINIO_ROOT_USER", "admin")),
        help="Access key",
    )
    parser.add_argument(
        "--secret-key",
        default=os.environ.get("MINIO_SECRET_KEY", os.environ.get("MINIO_ROOT_PASSWORD", "admin12345")),
        help="Secret key",
    )
    parser.add_argument("--region", default="us-east-1", help="Region name for client")
    parser.add_argument(
        "--create-bucket",
        action="store_true",
        help="Create bucket if missing",
    )

    args = parser.parse_args()

    file_path = Path(args.file).expanduser().resolve()
    if not file_path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")

    upload_file_to_minio(
        file_path=file_path,
        key=args.key,
        bucket=args.bucket,
        endpoint=args.endpoint,
        access_key=args.access_key,
        secret_key=args.secret_key,
        region=args.region,
        create_bucket=args.create_bucket,
    )


if __name__ == "__main__":
    main()
