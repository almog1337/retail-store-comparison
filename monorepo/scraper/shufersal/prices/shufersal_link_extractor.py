from datetime import timedelta, datetime
import requests
from typing import List, Optional
from abstractions.link_extractor import LinkExtractor, Link
from bs4 import BeautifulSoup

class ShufersalLinkExtractor(LinkExtractor):
    """Scraper for Shufersal file links."""

    def __init__(self) -> None:
        self.base_url: str = "https://prices.shufersal.co.il/"
        self.divider: str = '/?page='

    def fetch_files_metadata(self, page: int) -> Optional[List[Link]]:
        """Fetch file metadata from Shufersal."""
        try:
            response = requests.get(self.base_url, params={'page': page}, verify=False)
            response.raise_for_status()
            html = response.text
            soup = BeautifulSoup(html, 'html.parser')

            rows = soup.find_all('tr', class_=['webgrid-row-style', 'webgrid-alternating-row'])

            file_data = []
            for row in rows:
                tds = row.find_all('td')
                if len(tds) >= 2:
                    link_tag = tds[0].find('a')
                    if link_tag and link_tag.get('href'):
                        link = link_tag['href']
                        if '.gz' in link:
                            date = tds[1].text.strip()
                            file_data.append({'url': link, 'date': date})

            return file_data if file_data else None
        except requests.RequestException as e:
            print(f"Error fetching data from {self.base_url}: {e}")
            return None

    def fetch_page_count(self) -> int:
        """Fetch the total number of pages available."""
        try:
            response = requests.get(self.base_url, verify=False)
            response.raise_for_status()
            html = response.text
            soup = BeautifulSoup(html, 'html.parser')
            links = [a['href'] for a in soup.find_all('a', href=True)]
            pages_links = [link for link in links if self.divider in link]
            counts = [int(link.split(self.divider)[-1]) for link in pages_links]
            return max(counts) if counts else -1
        except requests.RequestException as e:
            print(f"Error fetching page count from {self.base_url}: {e}")
            return 1

    def _is_file_within_time_window(self, file_meta: Link, stop_date: Optional[datetime]) -> bool:
        """Check if a file's date is within the time window."""
        try:
            file_date = datetime.strptime(file_meta['date'], '%m/%d/%Y %I:%M:%S %p')
            return stop_date is None or file_date >= stop_date
        except ValueError:
            return False

    def _fetch_pages_with_time_filter(
        self,
        page_count: int,
        stop_date: Optional[datetime],
        max_links: Optional[int] = None,
    ) -> List[Link]:
        """Fetch files from pages and filter by time window."""
        all_files: List[Link] = []
        print(f"Shufersal: Fetching files from {page_count} pages...")

        for page in range(1,  page_count + 1):
            print(f"Shufersal: Processing page {page}/{page_count}...", end=" ")
            files_metadata = self.fetch_files_metadata(page)
            if not files_metadata:
                print("No files found")
                break

            recent_files = [
                file_meta for file_meta in files_metadata
                if self._is_file_within_time_window(file_meta, stop_date)
            ]

            if max_links is not None:
                remaining = max_links - len(all_files)
                if remaining <= 0:
                    print("Shufersal: Reached max links limit, stopping")
                    break
                recent_files = recent_files[:remaining]

            all_files.extend(recent_files)
            print(f"Found {len(recent_files)} files within time window")

            if max_links is not None and len(all_files) >= max_links:
                print("Shufersal: Reached max links limit, stopping")
                break

            if not recent_files:
                print("Shufersal: No more recent files found, stopping pagination")
                break

        print(f"Shufersal: Completed. Total files collected: {len(all_files)}")
        return all_files

    def fetch(self, time_back: timedelta = None, max_links: Optional[int] = None) -> List[Link]:
        """Fetch and filter file metadata by time."""
        count = self.fetch_page_count()
        stop_date = datetime.now() - time_back if time_back else None
        if max_links is not None and max_links <= 0:
            return []
        return self._fetch_pages_with_time_filter(count, stop_date, max_links=max_links)
