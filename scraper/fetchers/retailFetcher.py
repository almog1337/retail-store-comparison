from abc import ABC, abstractmethod
from typing import List
from scrapers.retailScraper import FileMetadata


class RetailFetcher(ABC):
    """Base interface for downloading and extracting retail files."""

    @abstractmethod
    def download_and_extract(self, file_meta: FileMetadata) -> str:
        """Download and extract a single file."""
        pass

    def download_and_extract_all(self, files: List[FileMetadata]) -> List[str]:
        """Download and extract multiple files sequentially."""
        extracted: List[str] = []
        for file_meta in files:
            try:
                text = self.download_and_extract(file_meta)
                if text:
                    extracted.append(text)
            except Exception:
                continue
        return extracted
