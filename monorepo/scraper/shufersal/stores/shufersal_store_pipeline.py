from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional
from abstractions.scraping_pipeline import PipelineType, ScrapingPipeline, ExtractedFile
from abstractions.link_extractor import LinkExtractor
from abstractions.file_downloader import FileDownloader
from abstractions.parser import Parser


class ShufersalStoresPipeline(ScrapingPipeline):
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
    
    def pipeline_type(self) -> PipelineType:
        return "stores"

    def extract(self, time_back: timedelta = None, max_links: Optional[int] = None) -> List[ExtractedFile]:
        """Fetch, download, extract, and parse all files."""
        files = self.scraper.fetch(time_back=time_back, max_links=max_links)
        downloaded = self.fetcher.download_and_extract_all(files)

        results: List[ExtractedFile] = []
        for file_meta, text in downloaded:
            records = self.parser.parse(text)
            results.append({
                'source': {
                    'file_name': file_meta['file_name'],
                    'source_url': file_meta['url'],
                    'published_at': file_meta['date'],
                    'scraped_at': datetime.now(timezone.utc).isoformat(),
                },
                'records': records,
            })

        return results
