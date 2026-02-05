"""
Pipeline runner for orchestrating data extraction and upload to MinIO.
"""
import asyncio
from datetime import datetime, timedelta
from typing import Dict, Optional

from uploaders.upload_to_minio import upload_data_to_minio


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
        parsed_records = pipeline.extract(time_back=time_back)

        # Generate key with current date
        ingest_date = datetime.utcnow().date().isoformat()
        key = f"bronze/{pipeline_name}/ingest_date={ingest_date}/parsed_records.txt"

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
        Run all pipelines and upload their results to MinIO.

        Args:
            time_back: How far back to fetch data (default: 2 hours)
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
        
        async def run_with_semaphore(pipeline_name: str):
            async with semaphore:
                return pipeline_name, await asyncio.to_thread(
                    self.run_and_upload,
                    pipeline_name=pipeline_name,
                    time_back=time_back,
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

