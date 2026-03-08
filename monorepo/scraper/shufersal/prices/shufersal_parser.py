import xml.etree.ElementTree as ET
from typing import Dict, List
from abstractions.parser import Parser


class ShufersalParser(Parser):
    """Parser for Shufersal XML price files."""

    def _text(self, node: ET.Element) -> str:
        return node.text.strip() if node.text else ""

    def parse(self, content: str) -> List[Dict[str, str]]:
        """Parse Shufersal XML into item records including header metadata."""
        try:
            root = ET.fromstring(content)
        except ET.ParseError:
            return []

        # Extract header fields
        header_keys = [
            "ChainId",
            "SubChainId",
            "StoreId",
            "BikoretNo",
            "DllVerNo",
        ]
        header: Dict[str, str] = {}
        for key in header_keys:
            node = root.find(key)
            if node is not None:
                header[key] = self._text(node)

        items_node = root.find("Items")
        if items_node is None:
            return []

        item_elements = items_node.findall("Item")
        records: List[Dict[str, str]] = []
        for item in item_elements:
            rec: Dict[str, str] = dict(header)
            for child in item:
                rec[child.tag] = self._text(child)
            # Include Items@Count if present
            if "Count" in items_node.attrib:
                rec["ItemsCount"] = items_node.attrib.get("Count", "")
            records.append(rec)

        return records
