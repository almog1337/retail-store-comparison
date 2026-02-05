from abc import ABC, abstractmethod
from typing import List, Dict


class Parser(ABC):
    """Base interface for parsing retail file content."""

    @abstractmethod
    def parse(self, content: str) -> List[Dict[str, str]]:
        """Parse raw content into records."""
        pass
