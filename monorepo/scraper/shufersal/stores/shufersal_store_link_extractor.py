from datetime import timedelta, datetime
import requests
from typing import List, Optional
from abstractions.link_extractor import LinkExtractor, Link
from bs4 import BeautifulSoup

class ShufersalStoresLinkExtractor(LinkExtractor):
    """Scraper for Shufersal file links."""

    def __init__(self) -> None:
        self.base_url: str = "https://prices.shufersal.co.il/FileObject/UpdateCategory?catID=5&storeId=0"
        self.divider: str = ''

    def fetch_files_metadata(self) -> Optional[List[Link]]:
        """Fetch file metadata from Shufersal."""
        try:
            response = requests.get(self.base_url, verify=False)
            response.raise_for_status()
            html = response.text
            soup = BeautifulSoup(html, 'html.parser')

            rows = soup.find_all('tr', class_=['webgrid-row-style'])

            file_data = []
            for row in rows:
                tds = row.find_all('td')
                link_tag = tds[0].find('a')
                if link_tag and link_tag.get('href'):
                    link = link_tag['href']
                    date = tds[1].text.strip()
                    file_name = tds[6].text.strip()
                    file_data.append({'url': link, 'date': date, 'file_name': file_name})

            return file_data if file_data else None
        except requests.RequestException as e:
            print(f"Error fetching data from {self.base_url}: {e}")
            return None

    def fetch(self, time_back: timedelta = None, max_links: Optional[int] = None) -> List[Link]:
        """Fetch and filter file metadata by time."""
        return self.fetch_files_metadata() or []
