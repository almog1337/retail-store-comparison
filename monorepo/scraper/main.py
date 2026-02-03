from datetime import timedelta

from bootstrapper import create_orchestrators
from pipeline_runner import PipelineRunner


def main():
    orchestrators = create_orchestrators()
    runner = PipelineRunner(orchestrators)

    parsed_records = runner.run_and_upload(
        orchestrator_name="shufersal",
        time_back=timedelta(hours=2),
        create_bucket=True,
    )

    print(parsed_records)


if __name__ == "__main__":
    main()
