from datetime import timedelta
from pathlib import Path
from dotenv import load_dotenv
from bootstrapper import create_pipelines
from pipeline_runner import PipelineRunner
import urllib3

# Load environment variables from root .env file
load_dotenv(Path(__file__).parent.parent.parent / ".env")

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def main():
    pipelines = create_pipelines()
    runner = PipelineRunner(pipelines)

    parsed_records = runner.run_and_upload(
        pipeline_name="shufersal",
        time_back=timedelta(hours=6),
        max_links=6,
        create_bucket=True,
    )

if __name__ == "__main__":
    main()
