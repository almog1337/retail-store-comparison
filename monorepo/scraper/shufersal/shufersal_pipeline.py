from datetime import timedelta
from typing import Dict, List, Optional
from abstractions.scraping_pipeline import ScrapingPipeline
from abstractions.link_extractor import LinkExtractor
from abstractions.file_downloader import FileDownloader
from abstractions.parser import Parser


class shufersalPipeline(ScrapingPipeline):
    """Orchestrates Shufersal scraping, fetching, and parsing."""

    def __init__(
        self,
        scraper: LinkExtractor,
        fetcher: FileDownloader,
        parser: Parser,
    ) -> None:
        self.scraper = scraper
        self.fetcher = fetcher
        self.parser = parser

    def extract(self, time_back: timedelta = None, max_links: Optional[int] = None) -> List[Dict[str, str]]:
        """Fetch, download, extract, and parse all files."""
        files = self.scraper.fetch(time_back=time_back, max_links=max_links)
        extracted_texts = self.fetcher.download_and_extract_all(files)

        all_records: List[Dict[str, str]] = []
        for text in extracted_texts:
            records = self.parser.parse(text)
            all_records.extend(records)

        return all_records
