import xml.etree.ElementTree as ET
from typing import Dict, List, Optional
from abstractions.parser import Parser


class ShufersalStoresParser(Parser):
    """Parser for Shufersal store XML files."""

    KEY_MAP = {
        "CHAINID": "ChainId",
        "SUBCHAINID": "SubChainId",
        "STOREID": "StoreId",
        "BIKORETNO": "BikoretNo",
        "STORETYPE": "StoreType",
        "CHAINNAME": "ChainName",
        "SUBCHAINNAME": "SubChainName",
        "STORENAME": "StoreName",
        "ADDRESS": "Address",
        "CITY": "City",
        "ZIPCODE": "ZipCode",
    }

    def _local_name(self, tag: str) -> str:
        if "}" in tag:
            return tag.split("}", 1)[1]
        return tag

    def _normalized_key(self, raw_key: str) -> str:
        normalized = self.KEY_MAP.get(raw_key.upper())
        if normalized is None:
            # Temporary stdout logging; can be swapped for a structured logger later.
            print(f"[ShufersalStoresParser] Missing key mapping for '{raw_key}', using original key.")
            return raw_key
        return normalized

    def _find_child(self, node: ET.Element, child_name: str) -> Optional[ET.Element]:
        target = child_name.upper()
        for child in node:
            if self._local_name(child.tag).upper() == target:
                return child
        return None

    def _find_children(self, node: ET.Element, child_name: str) -> List[ET.Element]:
        target = child_name.upper()
        return [
            child
            for child in node
            if self._local_name(child.tag).upper() == target
        ]

    def _text(self, node: ET.Element) -> str:
        return node.text.strip() if node.text else ""

    def parse(self, content: str) -> List[Dict[str, str]]:
        """Parse Shufersal stores XML into one record per STORE node."""
        try:
            root = ET.fromstring(content)
        except ET.ParseError:
            return []

        # Shufersal stores files are wrapped in ABAP XML: <asx:abap><asx:values>...</asx:values>
        values_node = root
        if self._local_name(root.tag).upper() == "ABAP":
            values_child = self._find_child(root, "values")
            if values_child is None:
                return []
            values_node = values_child

        header: Dict[str, str] = {}
        chain_node = self._find_child(values_node, "CHAINID")
        if chain_node is not None:
            header["ChainId"] = self._text(chain_node)
        last_update_node = self._find_child(values_node, "LASTUPDATEDATE")
        if last_update_node is not None:
            header["LastUpdateDate"] = self._text(last_update_node)

        stores_node = self._find_child(values_node, "STORES")
        if stores_node is None:
            return []

        records: List[Dict[str, str]] = []
        for store in self._find_children(stores_node, "STORE"):
            rec: Dict[str, str] = dict(header)
            for child in store:
                key = self._normalized_key(self._local_name(child.tag))
                rec[key] = self._text(child)
            records.append(rec)

        return records
