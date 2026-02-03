from datetime import timedelta
from typing import Dict, List
from orchestrators.retailOrchestrator import RetailOrchestrator
from scrapers.retailScraper import RetailScraper
from fetchers.retailFetcher import RetailFetcher
from parsers.retailParser import RetailParser


class ShufersalOrchestrator(RetailOrchestrator):
    """Orchestrates Shufersal scraping, fetching, and parsing."""

    def __init__(
        self,
        scraper: RetailScraper,
        fetcher: RetailFetcher,
        parser: RetailParser,
    ) -> None:
        self.scraper = scraper
        self.fetcher = fetcher
        self.parser = parser

    def extract(self, time_back: timedelta = None) -> List[Dict[str, str]]:
        """Fetch, download, extract, and parse all files."""
        files = self.scraper.fetch(time_back=time_back)
        extracted_texts = self.fetcher.download_and_extract_all(files)

        all_records: List[Dict[str, str]] = []
        for text in extracted_texts:
            records = self.parser.parse(text)
            all_records.extend(records)

        return all_records
