"""
Pipeline runner for orchestrating data extraction and upload to MinIO.
"""
import asyncio
import os
from datetime import datetime, timedelta
from typing import Dict, Optional
import pandas as pd
import requests


def upload_data_to_uploader(records: list, key: str, create_bucket: bool) -> None:
    uploader_url = os.environ.get("UPLOADER_URL", "http://localhost:8000/minio")
    api_key = os.environ.get("UPLOADER_API_KEY", "dev-key")
    headers = {"Authorization": f"Bearer {api_key}"}
    payload = {"key": key, "records": records, "create_bucket": create_bucket}

    response = requests.post(uploader_url, json=payload, headers=headers, timeout=120)
    response.raise_for_status()


class PipelineRunner:
    """Handles running pipelines and uploading results to MinIO."""

    def __init__(self, pipelines: Dict):
        """
        Initialize the pipeline runner with pipelines.
        Args:
            pipelines: Dictionary of pipeline instances keyed by name
        """
        self.pipelines = pipelines

    def run_and_upload(
        self,
        pipeline_name: str,
        time_back: Optional[timedelta] = None,
        max_links: Optional[int] = None,
        create_bucket: bool = True,
        bucket: Optional[str] = None,
        endpoint: Optional[str] = None,
        access_key: Optional[str] = None,
        secret_key: Optional[str] = None,
    ) -> list:
        """
        Run a specific pipeline and upload results to MinIO.

        Args:
            pipeline_name: Name of the pipeline to run
            time_back: How far back to fetch data (default: 2 hours)
            max_links: Max number of file links to process (optional)
            create_bucket: Whether to create bucket if it doesn't exist
            bucket: MinIO bucket name (optional, uses default if not provided)
            endpoint: MinIO endpoint URL (optional)
            access_key: MinIO access key (optional)
            secret_key: MinIO secret key (optional)

        Returns:
            List of parsed records

        Raises:
            KeyError: If pipeline_name is not found
        """
        if pipeline_name not in self.pipelines:
            raise KeyError(f"Pipeline '{pipeline_name}' not found")

        time_back = time_back or timedelta(hours=2)
        pipeline = self.pipelines[pipeline_name]

        # Extract data
        parsed_records = pipeline.extract(time_back=time_back, max_links=max_links)

        # Group records by sub_chain_id, store_id, and bikoret_no using pandas
        if parsed_records:
            df = pd.DataFrame(parsed_records)
            grouped = df.groupby(["SubChainId", "StoreId", "BikoretNo"])
            
            # Upload grouped records
            timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
            for (sub_chain_id, store_id, bikoret_no), group_df in grouped:
                key = f"bronze/{pipeline_name}/sub_chain_id={sub_chain_id}/store_id={store_id}/bikoret_no={bikoret_no}/{timestamp}_parsed_records.txt"
                records = group_df.to_dict("records")
                upload_data_to_uploader(records=records, key=key, create_bucket=create_bucket)

        return parsed_records

    def run_all_and_upload(
        self,
        time_back: Optional[timedelta] = None,
        max_links: Optional[int] = None,
        create_bucket: bool = True,
        bucket: Optional[str] = None,
        endpoint: Optional[str] = None,
        access_key: Optional[str] = None,
        secret_key: Optional[str] = None,
        max_workers: int = 1,
    ) -> Dict[str, list]:
        """
        Run all pipelines and upload their results to MinIO.

        Args:
            time_back: How far back to fetch data (default: 2 hours)
            max_links: Max number of file links to process per pipeline (optional)
            create_bucket: Whether to create bucket if it doesn't exist
            bucket: MinIO bucket name (optional)
            endpoint: MinIO endpoint URL (optional)
            access_key: MinIO access key (optional)
            secret_key: MinIO secret key (optional)
            max_workers: Maximum number of pipelines to run concurrently (default: 1)

        Returns:
            Dictionary mapping pipeline names to their parsed records
        """
        if max_workers == 1:
            # Sequential execution
            results = {}
            for pipeline_name in self.pipelines:
                records = self.run_and_upload(
                    pipeline_name=pipeline_name,
                    time_back=time_back,
                    max_links=max_links,
                    create_bucket=create_bucket,
                    bucket=bucket,
                    endpoint=endpoint,
                    access_key=access_key,
                    secret_key=secret_key,
                )
                results[pipeline_name] = records
            return results
        else:
            # Concurrent execution using asyncio
            return asyncio.run(
                self._run_all_concurrent(
                    time_back=time_back,
                    max_links=max_links,
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
        max_links: Optional[int],
        create_bucket: bool,
        bucket: Optional[str],
        endpoint: Optional[str],
        access_key: Optional[str],
        secret_key: Optional[str],
        max_workers: int,
    ) -> Dict[str, list]:
        """Internal method for concurrent execution using asyncio."""
        semaphore = asyncio.Semaphore(max_workers)
        
        async def run_with_semaphore(pipeline_name: str):
            async with semaphore:
                return pipeline_name, await asyncio.to_thread(
                    self.run_and_upload,
                    pipeline_name=pipeline_name,
                    time_back=time_back,
                    max_links=max_links,
                    create_bucket=create_bucket,
                    bucket=bucket,
                    endpoint=endpoint,
                    access_key=access_key,
                    secret_key=secret_key,
                )
        
        tasks = [run_with_semaphore(name) for name in self.pipelines]
        results = {}
        
        for coro in asyncio.as_completed(tasks):
            try:
                pipeline_name, records = await coro
                results[pipeline_name] = records
                print(f"Successfully completed: {pipeline_name}")
            except Exception as exc:
                print(f"Error running pipeline: {exc}")
        
        return results

