import argparse
import os
from pathlib import Path
from typing import Optional

import boto3
from botocore.client import Config
from botocore.exceptions import ClientError

def ensure_bucket(s3_client, bucket_name: str) -> None:
    """Ensure the bucket exists, create it if it doesn't."""
    try:
        s3_client.head_bucket(Bucket=bucket_name)
    except ClientError as e:
        error_code = int(e.response['Error']['Code'])
        if error_code == 404:
            try:
                s3_client.create_bucket(Bucket=bucket_name)
            except ClientError as create_err:
                if "BucketAlreadyExists" not in str(create_err):
                    raise
        elif error_code == 403:
            # If we get 403, try to create the bucket anyway
            try:
                s3_client.create_bucket(Bucket=bucket_name)
            except ClientError as create_err:
                if "BucketAlreadyExists" not in str(create_err):
                    raise
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
    access_key = access_key or os.environ.get("MINIO_ACCESS_KEY", os.environ.get("MINIO_ROOT_USER", "minioadmin"))
    secret_key = secret_key or os.environ.get("MINIO_SECRET_KEY", os.environ.get("MINIO_ROOT_PASSWORD", "minioadmin123"))

    s3 = boto3.client(
        "s3",
        endpoint_url=endpoint,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name=region,
        config=Config(signature_version="s3v4"),
    )

    if create_bucket:
        try:
            ensure_bucket(s3, bucket)
        except ClientError as e:
            if "InvalidAccessKeyId" in str(e):
                raise ValueError(
                    f"Invalid MinIO credentials. Check MINIO_ACCESS_KEY and MINIO_SECRET_KEY. "
                    f"Endpoint: {endpoint}, Bucket: {bucket}"
                )
            raise

    # Convert data to NDJSON format
    ndjson_content = "\n".join(str(record) for record in data)

    s3.put_object(Bucket=bucket, Key=key, Body=ndjson_content.encode("utf-8"))
    print(f"Uploaded data to s3://{bucket}/{key}")
