from typing import Protocol


class StorageBackend(Protocol):
    """Storage backend interface for uploader services."""

    def upload_records(self, records: list, key: str, create_bucket: bool = False) -> None:
        ...
