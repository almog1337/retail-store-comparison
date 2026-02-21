import boto3
from botocore.client import Config
from botocore.exceptions import ClientError


def ensure_bucket(s3_client, bucket_name: str) -> None:
    """Ensure the bucket exists, create it if it doesn't."""
    try:
        s3_client.head_bucket(Bucket=bucket_name)
    except ClientError as exc:
        error_code = int(exc.response["Error"]["Code"])
        if error_code in (403, 404):
            try:
                s3_client.create_bucket(Bucket=bucket_name)
            except ClientError as create_err:
                if "BucketAlreadyExists" not in str(create_err):
                    raise
        else:
            raise


class MinioStorage:
    """MinIO storage backend for uploading NDJSON records."""

    def __init__(
        self,
        bucket: str,
        endpoint: str,
        access_key: str,
        secret_key: str,
        region: str,
    ) -> None:
        self.bucket = bucket
        self.endpoint = endpoint
        self.access_key = access_key
        self.secret_key = secret_key
        self.region = region

    def _client(self):
        return boto3.client(
            "s3",
            endpoint_url=self.endpoint,
            aws_access_key_id=self.access_key,
            aws_secret_access_key=self.secret_key,
            region_name=self.region,
            config=Config(signature_version="s3v4"),
        )

    def upload_records(self, records: list, key: str, create_bucket: bool = False) -> None:
        s3 = self._client()

        if create_bucket:
            try:
                ensure_bucket(s3, self.bucket)
            except ClientError as exc:
                if "InvalidAccessKeyId" in str(exc):
                    raise ValueError(
                        "Invalid MinIO credentials. Check MINIO_ACCESS_KEY and MINIO_SECRET_KEY. "
                        f"Endpoint: {self.endpoint}, Bucket: {self.bucket}"
                    )
                raise

        ndjson_content = "\n".join(str(record) for record in records)
        s3.put_object(Bucket=self.bucket, Key=key, Body=ndjson_content.encode("utf-8"))
        print(f"Uploaded data to s3://{self.bucket}/{key}")
