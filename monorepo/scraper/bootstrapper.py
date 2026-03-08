from typing import Dict
from abstractions.scraping_pipeline import ScrapingPipeline
from shufersal.prices.shufersal_pipeline import ShufersalPipeline
from shufersal.prices.shufersal_link_extractor import ShufersalLinkExtractor
from shufersal.prices.shufersal_parser import ShufersalParser
from shufersal.prices.shufersal_downloader import ShufersalDownloader

from shufersal.stores.shufersal_store_pipeline import ShufersalStoresPipeline
from shufersal.stores.shufersal_store_link_extractor import ShufersalStoresLinkExtractor
from shufersal.stores.shufersal_store_parser import ShufersalStoresParser
from shufersal.stores.shufersal_store_downloader import ShufersalStoresDownloader

def create_pipelines() -> Dict[str, ScrapingPipeline]:
    """Create and return all available pipelines."""
    
    shufersal_pipeline = ShufersalPipeline(
        ShufersalLinkExtractor(),
        ShufersalDownloader(),
        ShufersalParser(),
    )

    shufersal_store_pipeline = ShufersalStoresPipeline(
        ShufersalStoresLinkExtractor(),
        ShufersalStoresDownloader(),
        ShufersalStoresParser(),
    )

    return {
        "shufersal": shufersal_pipeline,
        "shufersal_stores": shufersal_store_pipeline
    }
