from typing import Dict
from abstractions.scraping_pipeline import ScrapingPipeline
from shufersal.shufersal_pipeline import shufersalPipeline
from shufersal.shufersal_link_extractor import ShufersalLinkExtractor
from shufersal.shufersal_parser import ShufersalParser
from shufersal.shufersal_downloader import ShufersalDownloader

def create_pipelines() -> Dict[str, ScrapingPipeline]:
    """Create and return all available pipelines."""
    shufersal_scraper = ShufersalLinkExtractor()
    shufersal_downloader = ShufersalDownloader()
    shufersal_parser = ShufersalParser()
    shufersal_pipeline = shufersalPipeline(
        shufersal_scraper,
        shufersal_downloader,
        shufersal_parser,
    )

    return {
        "shufersal": shufersal_pipeline,
    }
