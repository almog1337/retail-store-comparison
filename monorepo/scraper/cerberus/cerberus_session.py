"""
Authenticated session for Cerberus (publishedprices.co.il) servers.

Handles CSRF token extraction, login, file listing, and file download.
One session instance should be shared across link extractor and downloader
for the same chain to avoid redundant logins.
"""
import re
from typing import Any, Dict, List

import requests
import urllib3

# Suppress InsecureRequestWarning for verify=False (same pattern as existing scrapers)
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


class CerberusSession:
    """Manages an authenticated requests.Session against a Cerberus server."""

    def __init__(self, base_url: str, username: str, password: str = ""):
        self.base_url = base_url.rstrip("/")
        self.username = username
        self.password = password
        self._session = requests.Session()
        self._session.verify = False
        self._logged_in = False

    def _extract_csrf(self, html: str) -> str:
        """Extract CSRF token from a <meta name="csrftoken" content="..."> tag."""
        match = re.search(r'<meta\s+name="csrftoken"\s+content="([^"]*)"', html)
        return match.group(1) if match else ""

    def login(self) -> None:
        """Authenticate against the Cerberus login endpoint."""
        login_page = self._session.get(f"{self.base_url}/login")
        login_page.raise_for_status()
        csrf_token = self._extract_csrf(login_page.text)

        login_data = {
            "username": self.username,
            "password": self.password,
            "r": "",
            "csrftoken": csrf_token,
        }
        response = self._session.post(
            f"{self.base_url}/login/user",
            data=login_data,
            allow_redirects=True,
        )
        response.raise_for_status()
        self._logged_in = True

    def _ensure_logged_in(self) -> None:
        """Lazy login: authenticate on the first API call."""
        if not self._logged_in:
            self.login()

    def fetch_file_list(self) -> List[Dict[str, Any]]:
        """
        Fetch the full file listing from the Cerberus JSON API.

        Returns a list of file dicts, each containing at least:
          - fname: file name
          - ftime: last-modified / publication timestamp string
          - size: file size
        """
        self._ensure_logged_in()

        # Get a fresh CSRF token from the file browsing page
        file_page = self._session.get(f"{self.base_url}/file/d/")
        file_page.raise_for_status()
        csrf_token = self._extract_csrf(file_page.text)

        params = {
            "sEcho": "1",
            "iDisplayStart": "0",
            "iDisplayLength": "100000",
            "csrftoken": csrf_token,
        }
        response = self._session.post(
            f"{self.base_url}/file/json/dir",
            data=params,
        )
        response.raise_for_status()

        content_type = response.headers.get("Content-Type", "")
        if "application/json" not in content_type:
            raise RuntimeError(
                f"Cerberus file listing returned non-JSON response "
                f"(Content-Type: {content_type}). Login may have failed."
            )

        data = response.json()
        files = data.get("aaData") or data.get("data") or data.get("files") or []
        return files

    def download_file(self, fname: str) -> bytes:
        """Download a single file by name, returning raw bytes."""
        self._ensure_logged_in()
        response = self._session.get(
            f"{self.base_url}/file/d/{fname}",
            timeout=120,
        )
        response.raise_for_status()
        return response.content
