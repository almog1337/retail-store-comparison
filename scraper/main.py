from datetime import datetime, timedelta
from pathlib import Path

from scrapers.shufersalScraper import ShufersalScraper
from fetchers.shufersalFetcher import ShufersalFetcher
from parsers.shufersalParser import ShufersalParser
from ingesters.shufersalIngester import ShufersalIngester
from uploader.upload_to_minio import upload_data_to_minio


def main():
    scraper = ShufersalScraper()
    fetcher = ShufersalFetcher()
    parser = ShufersalParser()
    ingester = ShufersalIngester(scraper, fetcher, parser)

    parsed_records = ingester.ingest(time_back=timedelta(hours=2))

    #### comment for almog ####
    #### you need to change logic of saving to s3 with record for each day&retailer ####

    ingest_date = datetime.utcnow().date().isoformat()
    key = f"bronze/shufersal/ingest_date={ingest_date}/parsed_records.txt"
    upload_data_to_minio(parsed_records, key, create_bucket=True)

    print(parsed_records)


if __name__ == "__main__":
    main()
