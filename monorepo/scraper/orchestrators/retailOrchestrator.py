from abc import ABC, abstractmethod
from datetime import timedelta
from typing import Dict, List
from scrapers.retailScraper import RetailScraper
from fetchers.retailFetcher import RetailFetcher
from parsers.retailParser import RetailParser


class RetailOrchestrator(ABC):
    """Base interface for orchestrating scraping, fetching, and parsing."""

    @abstractmethod
    def extract(self, time_back: timedelta = None) -> List[Dict[str, str]]:
        """Fetch files, download, extract, and parse them."""
        raise NotImplementedError
