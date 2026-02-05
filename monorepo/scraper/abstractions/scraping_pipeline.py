from abc import ABC, abstractmethod
from datetime import timedelta
from typing import Dict, List

class ScrapingPipeline(ABC):
    """Base interface for orchestrating scraping, fetching, and parsing."""

    @abstractmethod
    def extract(self, time_back: timedelta = None) -> List[Dict[str, str]]:
        """Fetch files, download, extract, and parse them."""
        raise NotImplementedError
