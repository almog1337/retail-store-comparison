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
from cerberus.cerberus_link_extractor import CerberusLinkExtractor
from cerberus.cerberus_downloader import CerberusDownloader
from cerberus.cerberus_pipeline import CerberusPipeline


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

    rami_levy_pipeline = CerberusPipeline(
        scraper=CerberusLinkExtractor(rami_levy_session, r"Price.*\.gz"),
        fetcher=CerberusDownloader(rami_levy_session),
        parser=ShufersalParser(),
        type="prices",
    )

    rami_levy_stores_pipeline = CerberusPipeline(
        scraper=CerberusLinkExtractor(rami_levy_session, r"Stores.*\.xml"),
        fetcher=CerberusDownloader(rami_levy_session),
        parser=ShufersalStoresParser(),
        type="stores",
    )

    return {
        "shufersal": shufersal_pipeline,
        "shufersal_stores": shufersal_store_pipeline,
        "rami_levy": rami_levy_pipeline,
        "rami_levy_stores": rami_levy_stores_pipeline,
    }
