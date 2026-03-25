import xml.etree.ElementTree as ET
from typing import Dict, List, Optional

from abstractions.parser import Parser


class RamiLevyPricesParser(Parser):
    """Parser for Rami Levy prices XML files served via Cerberus."""

    def _text(self, node: ET.Element) -> str:
        return node.text.strip() if node.text else ""

    def _find_first_text(self, root: ET.Element, tags: List[str]) -> Optional[str]:
        for tag in tags:
            node = root.find(tag)
            if node is not None:
                return self._text(node)
        return None

    def parse(self, content: str) -> List[Dict[str, str]]:
        """Parse Rami Levy prices XML into item records including header metadata."""
        if not content:
            return []

        # Rami Levy payloads can start with BOM and use uppercase ID tags (e.g. ChainID).
        sanitized_content = content.lstrip("\ufeff")

        try:
            root = ET.fromstring(sanitized_content)
        except ET.ParseError:
            return []

        header_candidates = {
            "ChainId": ["ChainId", "ChainID"],
            "SubChainId": ["SubChainId", "SubChainID"],
            "StoreId": ["StoreId", "StoreID"],
            "BikoretNo": ["BikoretNo"],
            "DllVerNo": ["DllVerNo", "DllVerNO"],
        }

        header: Dict[str, str] = {}
        for key, tags in header_candidates.items():
            value = self._find_first_text(root, tags)
            if value is not None:
                header[key] = value

        items_node = root.find("Items")
        if items_node is None:
            return []

        records: List[Dict[str, str]] = []
        for item in items_node.findall("Item"):
            rec: Dict[str, str] = dict(header)
            for child in item:
                rec[child.tag] = self._text(child)
            if "Count" in items_node.attrib:
                rec["ItemsCount"] = items_node.attrib.get("Count", "")
            records.append(rec)

        return records