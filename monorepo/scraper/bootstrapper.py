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

from cerberus.cerberus_session import CerberusSession
from cerberus.rami_levy.prices.rami_levy_pipeline import RamiLevyPipeline
from cerberus.rami_levy.stores.rami_levy_store_pipeline import RamiLevyStoresPipeline


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

    # Rami Levy — Cerberus server (reuses government-standard XML parsers)
    rami_levy_session = CerberusSession(
        base_url="https://url.publishedprices.co.il",
        username="RamiLevi",
        password="",
    )

    rami_levy_pipeline = RamiLevyPipeline(rami_levy_session)

    rami_levy_stores_pipeline = RamiLevyStoresPipeline(rami_levy_session)

    return {
        "shufersal": shufersal_pipeline,
        "shufersal_stores": shufersal_store_pipeline,
        "rami_levy": rami_levy_pipeline,
        "rami_levy_stores": rami_levy_stores_pipeline,
    }
