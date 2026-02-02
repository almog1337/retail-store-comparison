from datetime import datetime, timedelta
from pathlib import Path

from bootstrapper import create_orchestrators
from uploader.upload_to_minio import upload_data_to_minio


def main():
    orchestrators = create_orchestrators()
    orchestrator = orchestrators["shufersal"]

    parsed_records = orchestrator.extract(time_back=timedelta(hours=2))

    ingest_date = datetime.utcnow().date().isoformat()
    key = f"bronze/shufersal/ingest_date={ingest_date}/parsed_records.txt"
    upload_data_to_minio(parsed_records, key, create_bucket=True)

    print(parsed_records)


if __name__ == "__main__":
    main()
