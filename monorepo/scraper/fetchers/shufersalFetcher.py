import gzip
import requests
from scrapers.retailScraper import FileMetadata
from fetchers.retailFetcher import RetailFetcher


class ShufersalFetcher(RetailFetcher):
    """Fetcher for Shufersal .gz files."""

    def __init__(self, timeout: int = 30, verify_ssl: bool = False) -> None:
        self.timeout = timeout
        self.verify_ssl = verify_ssl

    def download_and_extract(self, file_meta: FileMetadata) -> str:
        """Download and extract a Shufersal .gz file."""
        response = requests.get(file_meta["url"], timeout=self.timeout, verify=self.verify_ssl)
        response.raise_for_status()
        content = response.content

        try:
            decompressed = gzip.decompress(content)
        except OSError:
            decompressed = content

        return decompressed.decode("utf-8", errors="replace")
