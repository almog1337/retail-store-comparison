"""
Link extractor for Cerberus (publishedprices.co.il) servers.

Fetches the full file listing via CerberusSession, then filters by a
caller-supplied regex pattern and optional time window.
"""
import re
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from abstractions.link_extractor import Link, LinkExtractor
from cerberus.cerberus_session import CerberusSession


# Known date formats on Cerberus servers
_DATE_FORMATS = [
    "%Y/%m/%d %H:%M:%S",
    "%Y-%m-%d %H:%M:%S",
    "%m/%d/%Y %I:%M:%S %p",
]


def _parse_date(raw: str) -> Optional[datetime]:
    """Try several date formats; return None if none match."""
    for fmt in _DATE_FORMATS:
        try:
            return datetime.strptime(raw.strip(), fmt).replace(tzinfo=timezone.utc)
        except ValueError:
            continue
    return None


class CerberusLinkExtractor(LinkExtractor):
    """Filters the Cerberus file listing by regex and recency."""

    def __init__(self, session: CerberusSession, file_regex: str):
        self.session = session
        self.file_regex = re.compile(file_regex)

    def fetch(
        self,
        time_back: timedelta = None,
        max_links: Optional[int] = None,
    ) -> List[Link]:
        files = self.session.fetch_file_list()

        stop_date = (
            datetime.now(timezone.utc) - time_back if time_back else None
        )

        links: List[Link] = []
        for f in files:
            fname = (
                f.get("fname") or f.get("name") or f.get("Name", "")
                if isinstance(f, dict)
                else ""
            )
            if not fname or not self.file_regex.search(fname):
                continue

            raw_date = (
                f.get("ftime") or f.get("date") or f.get("Date", "")
                if isinstance(f, dict)
                else ""
            )
            parsed_date = _parse_date(raw_date) if raw_date else None

            if stop_date and parsed_date and parsed_date < stop_date:
                continue

            links.append(
                Link(
                    url=f"{self.session.base_url}/file/d/{fname}",
                    date=raw_date,
                    file_name=fname,
                )
            )

        # Sort newest first so max_links keeps the most recent files
        links.sort(key=lambda l: _parse_date(l["date"]) or datetime.min.replace(tzinfo=timezone.utc), reverse=True)

        if max_links is not None:
            links = links[:max_links]

        return links
