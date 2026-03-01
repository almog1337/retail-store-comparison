import { Injectable, BadRequestException } from "@nestjs/common";
import { ShufersalRecordMapper } from "./shufersal-record.mapper";
import { IRecordMapper } from "./record-mapper.interface";

const PIPELINE_NAMES = {
  SHUFERSAL: "shufersal",
} as const;

/**
 * Factory for creating pipeline-specific record mappers.
 * Routes to the correct mapper based on pipeline name.
 * Implements Single Responsibility: each pipeline has its own mapper class.
 * Implements Open/Closed: new pipelines can be added without modifying existing code.
 */
@Injectable()
export class RecordMapperFactory {
  constructor(private readonly shufersalMapper: ShufersalRecordMapper) {}

  /**
   * Get the appropriate mapper for the given pipeline.
   * @param pipelineName - Name of the pipeline (e.g., 'shufersal')
   * @returns The mapper instance for the pipeline
   * @throws BadRequestException if pipeline is not supported
   */
  getMapper(pipelineName: string): IRecordMapper {
    switch (pipelineName.toLowerCase()) {
      case PIPELINE_NAMES.SHUFERSAL:
        return this.shufersalMapper;
      default:
        throw new BadRequestException(
          `No mapper found for pipeline: ${pipelineName}. Supported pipelines: ${Object.values(PIPELINE_NAMES).join(", ")}`,
        );
    }
  }
}
