import gzip
import requests
from abstractions.link_extractor import Link
from abstractions.file_downloader import FileDownloader


class ShufersalDownloader(FileDownloader):
    """Fetcher for Shufersal .gz files."""

    def __init__(self, timeout: int = 30, verify_ssl: bool = False) -> None:
        self.timeout = timeout
        self.verify_ssl = verify_ssl

    def download_and_extract(self, file_meta: Link) -> str:
        """Download and extract a Shufersal .gz file."""
        response = requests.get(file_meta["url"], timeout=self.timeout, verify=self.verify_ssl)
        response.raise_for_status()
        content = response.content

        try:
            decompressed = gzip.decompress(content)
        except OSError:
            decompressed = content

        return decompressed.decode("utf-8", errors="replace")
