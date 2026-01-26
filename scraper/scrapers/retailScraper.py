from abc import ABC, abstractmethod
from datetime import timedelta
from typing import List, TypedDict


class FileMetadata(TypedDict):
    """Type definition for file metadata."""
    url: str
    date: str


class RetailScraper(ABC):
    """Base interface for scraping retail file links."""

    @abstractmethod
    def fetch(self, time_back: timedelta = None) -> List[FileMetadata]:
        """Fetch and filter file metadata by time."""
        pass