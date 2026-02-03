import argparse
import os
from pathlib import Path
from typing import Optional

import boto3
from botocore.client import Config
from botocore.exceptions import ClientError

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
