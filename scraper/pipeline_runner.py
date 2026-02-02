"""
Pipeline runner for orchestrating data extraction and upload to MinIO.
"""
import asyncio
from datetime import datetime, timedelta
from typing import Dict, Optional

from uploaders.upload_to_minio import upload_data_to_minio


class PipelineRunner:
    """Handles running orchestrators and uploading results to MinIO."""

    def __init__(self, orchestrators: Dict):
        """
        Initialize the pipeline runner with orchestrators.

        Args:
            orchestrators: Dictionary of orchestrator instances keyed by name
        """
        self.orchestrators = orchestrators

    def run_and_upload(
        self,
        orchestrator_name: str,
        time_back: Optional[timedelta] = None,
        create_bucket: bool = True,
        bucket: Optional[str] = None,
        endpoint: Optional[str] = None,
        access_key: Optional[str] = None,
        secret_key: Optional[str] = None,
    ) -> list:
        """
        Run a specific orchestrator and upload results to MinIO.

        Args:
            orchestrator_name: Name of the orchestrator to run
            time_back: How far back to fetch data (default: 2 hours)
            create_bucket: Whether to create bucket if it doesn't exist
            bucket: MinIO bucket name (optional, uses default if not provided)
            endpoint: MinIO endpoint URL (optional)
            access_key: MinIO access key (optional)
            secret_key: MinIO secret key (optional)

        Returns:
            List of parsed records

        Raises:
            KeyError: If orchestrator_name is not found
        """
        if orchestrator_name not in self.orchestrators:
            raise KeyError(f"Orchestrator '{orchestrator_name}' not found")

        time_back = time_back or timedelta(hours=2)
        orchestrator = self.orchestrators[orchestrator_name]

        # Extract data
        parsed_records = orchestrator.extract(time_back=time_back)

        # Generate key with current date
        ingest_date = datetime.utcnow().date().isoformat()
        key = f"bronze/{orchestrator_name}/ingest_date={ingest_date}/parsed_records.txt"

        # Upload to MinIO
        upload_data_to_minio(
            data=parsed_records,
            key=key,
            bucket=bucket,
            endpoint=endpoint,
            access_key=access_key,
            secret_key=secret_key,
            create_bucket=create_bucket,
        )

        return parsed_records

    def run_all_and_upload(
        self,
        time_back: Optional[timedelta] = None,
        create_bucket: bool = True,
        bucket: Optional[str] = None,
        endpoint: Optional[str] = None,
        access_key: Optional[str] = None,
        secret_key: Optional[str] = None,
        max_workers: int = 1,
    ) -> Dict[str, list]:
        """
        Run all orchestrators and upload their results to MinIO.

        Args:
            time_back: How far back to fetch data (default: 2 hours)
            create_bucket: Whether to create bucket if it doesn't exist
            bucket: MinIO bucket name (optional)
            endpoint: MinIO endpoint URL (optional)
            access_key: MinIO access key (optional)
            secret_key: MinIO secret key (optional)
            max_workers: Maximum number of orchestrators to run concurrently (default: 1)

        Returns:
            Dictionary mapping orchestrator names to their parsed records
        """
        if max_workers == 1:
            # Sequential execution
            results = {}
            for orchestrator_name in self.orchestrators:
                records = self.run_and_upload(
                    orchestrator_name=orchestrator_name,
                    time_back=time_back,
                    create_bucket=create_bucket,
                    bucket=bucket,
                    endpoint=endpoint,
                    access_key=access_key,
                    secret_key=secret_key,
                )
                results[orchestrator_name] = records
            return results
        else:
            # Concurrent execution using asyncio
            return asyncio.run(
                self._run_all_concurrent(
                    time_back=time_back,
                    create_bucket=create_bucket,
                    bucket=bucket,
                    endpoint=endpoint,
                    access_key=access_key,
                    secret_key=secret_key,
                    max_workers=max_workers,
                )
            )

    async def _run_all_concurrent(
        self,
        time_back: Optional[timedelta],
        create_bucket: bool,
        bucket: Optional[str],
        endpoint: Optional[str],
        access_key: Optional[str],
        secret_key: Optional[str],
        max_workers: int,
    ) -> Dict[str, list]:
        """Internal method for concurrent execution using asyncio."""
        semaphore = asyncio.Semaphore(max_workers)
        
        async def run_with_semaphore(orchestrator_name: str):
            async with semaphore:
                return orchestrator_name, await asyncio.to_thread(
                    self.run_and_upload,
                    orchestrator_name=orchestrator_name,
                    time_back=time_back,
                    create_bucket=create_bucket,
                    bucket=bucket,
                    endpoint=endpoint,
                    access_key=access_key,
                    secret_key=secret_key,
                )
        
        tasks = [run_with_semaphore(name) for name in self.orchestrators]
        results = {}
        
        for coro in asyncio.as_completed(tasks):
            try:
                orchestrator_name, records = await coro
                results[orchestrator_name] = records
                print(f"Successfully completed: {orchestrator_name}")
            except Exception as exc:
                print(f"Error running orchestrator: {exc}")
        
        return results

