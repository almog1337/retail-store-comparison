"""
File downloader for Cerberus (publishedprices.co.il) servers.

Downloads files via the authenticated CerberusSession and decompresses
gzip content when applicable.
"""
import gzip

from abstractions.file_downloader import FileDownloader
from abstractions.link_extractor import Link
from cerberus.cerberus_session import CerberusSession


class CerberusDownloader(FileDownloader):
    """Downloads and extracts files from a Cerberus server."""

    def __init__(self, session: CerberusSession):
        self.session = session

    def download_and_extract(self, file_meta: Link) -> str:
        """Download a file by name and decompress if gzipped."""
        fname = file_meta["file_name"]
        raw = self.session.download_file(fname)

        if fname.lower().endswith(".xml"):
            return self._decode(raw)

        try:
            decompressed = gzip.decompress(raw)
        except OSError:
            decompressed = raw

        return self._decode(decompressed)

    @staticmethod
    def _decode(data: bytes) -> str:
        """Decode bytes, auto-detecting UTF-16 LE/BE via BOM."""
        if data[:2] == b"\xff\xfe":
            return data.decode("utf-16-le", errors="replace").lstrip("\ufeff")
        if data[:2] == b"\xfe\xff":
            return data.decode("utf-16-be", errors="replace").lstrip("\ufeff")
        return data.decode("utf-8", errors="replace")
