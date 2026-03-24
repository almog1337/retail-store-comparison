from abc import ABC, abstractmethod
from datetime import timedelta
from typing import Dict, List, Literal, Optional, TypedDict

PipelineType = Literal["prices", "stores"]


class SourceMetadata(TypedDict):
    """Metadata about the source file that was scraped."""
    file_name: str
    source_url: str
    published_at: str
    scraped_at: str


class ExtractedFile(TypedDict):
    """A single scraped file with its source metadata and parsed records."""
    source: SourceMetadata
    records: List[Dict[str, str]]


class ScrapingPipeline(ABC):
    """Base interface for orchestrating scraping, fetching, and parsing."""

    @abstractmethod
    def pipeline_type(self) -> PipelineType:
        """Return a unique identifier for this pipeline."""
        raise NotImplementedError

    @abstractmethod
    def extract(self, time_back: timedelta = None, max_links: Optional[int] = None) -> List[ExtractedFile]:
        """Fetch files, download, extract, and parse them."""
        raise NotImplementedError
