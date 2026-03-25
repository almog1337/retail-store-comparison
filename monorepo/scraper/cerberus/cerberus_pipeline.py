"""
Generic pipeline for Cerberus-based scrapers.

Unlike the Shufersal pipelines which hardcode their pipeline_type,
this pipeline accepts the type at construction time so a single class
can be reused for both prices and stores (or any future type).
"""
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from abstractions.file_downloader import FileDownloader
from abstractions.link_extractor import LinkExtractor
from abstractions.parser import Parser
from abstractions.scraping_pipeline import (
    ExtractedFile,
    PipelineType,
    ScrapingPipeline,
)


class CerberusPipeline(ScrapingPipeline):
    """Orchestrates scraping for any Cerberus-hosted chain."""

    def __init__(
        self,
        scraper: LinkExtractor,
        fetcher: FileDownloader,
        parser: Parser,
        type: PipelineType,
    ):
        self.scraper = scraper
        self.fetcher = fetcher
        self.parser = parser
        self._type = type

    def pipeline_type(self) -> PipelineType:
        return self._type

    def extract(
        self,
        time_back: timedelta = None,
        max_links: Optional[int] = None,
    ) -> List[ExtractedFile]:
        files = self.scraper.fetch(time_back=time_back, max_links=max_links)
        downloaded = self.fetcher.download_and_extract_all(files)

        results: List[ExtractedFile] = []
        for file_meta, text in downloaded:
            records = self.parser.parse(text)
            results.append(
                ExtractedFile(
                    source={
                        "file_name": file_meta["file_name"],
                        "source_url": file_meta["url"],
                        "published_at": file_meta["date"],
                        "scraped_at": datetime.now(timezone.utc).isoformat(),
                    },
                    records=records,
                )
            )

        return results
