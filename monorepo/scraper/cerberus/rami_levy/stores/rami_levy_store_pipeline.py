"""Rami Levy specific Cerberus stores pipeline."""

from cerberus.cerberus_downloader import CerberusDownloader
from cerberus.cerberus_link_extractor import CerberusLinkExtractor
from cerberus.cerberus_pipeline import CerberusPipeline
from cerberus.cerberus_session import CerberusSession
from shufersal.stores.shufersal_store_parser import ShufersalStoresParser


class RamiLevyStoresPipeline(CerberusPipeline):
    """Cerberus stores pipeline for Rami Levy."""

    def __init__(self, session: CerberusSession):
        super().__init__(
            scraper=CerberusLinkExtractor(session, r"Stores.*\.xml"),
            fetcher=CerberusDownloader(session),
            parser=ShufersalStoresParser(),
            type="stores",
        )