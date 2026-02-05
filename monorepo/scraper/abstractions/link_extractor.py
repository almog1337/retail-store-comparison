from abc import ABC, abstractmethod
from datetime import timedelta
from typing import List, Optional, TypedDict


class Link(TypedDict):
    """Type definition for file metadata."""
    url: str
    date: str


class LinkExtractor(ABC):
    """Base interface for scraping retail file links."""

    @abstractmethod
    def fetch(self, time_back: timedelta = None, max_links: Optional[int] = None) -> List[Link]:
        """Fetch and filter file metadata by time."""
        pass