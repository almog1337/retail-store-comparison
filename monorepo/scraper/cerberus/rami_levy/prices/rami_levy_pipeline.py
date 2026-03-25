"""Rami Levy specific Cerberus prices pipeline."""

from cerberus.cerberus_downloader import CerberusDownloader
from cerberus.cerberus_link_extractor import CerberusLinkExtractor
from cerberus.cerberus_pipeline import CerberusPipeline
from cerberus.cerberus_session import CerberusSession
from cerberus.rami_levy.prices.rami_levy_parser import RamiLevyPricesParser


class RamiLevyPipeline(CerberusPipeline):
    """Cerberus prices pipeline for Rami Levy."""

    def __init__(self, session: CerberusSession):
        super().__init__(
            scraper=CerberusLinkExtractor(session, r"Price.*\.gz"),
            fetcher=CerberusDownloader(session),
            parser=RamiLevyPricesParser(),
            type="prices",
        )