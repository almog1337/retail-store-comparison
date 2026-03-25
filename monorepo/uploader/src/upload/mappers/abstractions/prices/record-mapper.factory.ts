import { Injectable, BadRequestException } from "@nestjs/common";
import { ShufersalRecordMapper } from "../../shufersal/prices/shufersal-record.mapper";
import { RamiLevyRecordMapper } from "../../rami-levy/prices/rami-levy-record.mapper";
import { IRecordMapper } from "./record-mapper.interface";

const PIPELINE_NAMES = {
  SHUFERSAL: "shufersal",
  RAMI_LEVY: "rami_levy",
} as const;

/**
 * Factory for creating pipeline-specific record mappers.
 * Routes to the correct mapper based on pipeline name.
 * Implements Single Responsibility: each pipeline has its own mapper class.
 * Implements Open/Closed: new pipelines can be added without modifying existing code.
 */
@Injectable()
export class RecordMapperFactory {
  constructor(
    private readonly shufersalMapper: ShufersalRecordMapper,
    private readonly ramiLevyMapper: RamiLevyRecordMapper,
  ) {}

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
      case PIPELINE_NAMES.RAMI_LEVY:
        return this.ramiLevyMapper;
      default:
        throw new BadRequestException(
          `No mapper found for pipeline: ${pipelineName}. Supported pipelines: ${Object.values(PIPELINE_NAMES).join(", ")}`,
        );
    }
  }
}
