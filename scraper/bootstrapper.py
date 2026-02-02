from typing import Dict

from orchestrators.retailOrchestrator import RetailOrchestrator
from orchestrators.shufersalOrchestrator import ShufersalOrchestrator
from scrapers.shufersalScraper import ShufersalScraper
from fetchers.shufersalFetcher import ShufersalFetcher
from parsers.shufersalParser import ShufersalParser


def create_orchestrators() -> Dict[str, RetailOrchestrator]:
    """Create and return all available orchestrators."""
    shufersal_scraper = ShufersalScraper()
    shufersal_fetcher = ShufersalFetcher()
    shufersal_parser = ShufersalParser()
    shufersal_orchestrator = ShufersalOrchestrator(
        shufersal_scraper,
        shufersal_fetcher,
        shufersal_parser,
    )

    return {
        "shufersal": shufersal_orchestrator,
    }
