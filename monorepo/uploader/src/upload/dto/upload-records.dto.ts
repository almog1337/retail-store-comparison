import { IsArray, IsBoolean, IsIn, IsOptional, IsString } from "class-validator";
import { Transform } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ALLOWED_PIPELINE_NAMES } from "../constants/pipeline-names.constant";

export class UploadRecordsDto {
  @ApiProperty({
    description:
      "Pipeline name for organizing data in storage hierarchy. Must be one of the allowed pipeline names.",
    example: "shufersal",
    enum: ALLOWED_PIPELINE_NAMES,
  })
  @IsString()
  @IsIn(ALLOWED_PIPELINE_NAMES, {
    message: `pipeline_name must be one of the following values: ${ALLOWED_PIPELINE_NAMES.join(", ")}`,
  })
  pipeline_name: string;

  @ApiProperty({
    description:
      "Records to upload as JSON array. Each record must include SubChainId, StoreId, and BikoretNo for proper partitioning.",
    type: "array",
    example: [
      {
        SubChainId: "7290027600007",
        StoreId: "123",
        BikoretNo: "456",
        ItemCode: "7290000000001",
        ItemName: "Example Item",
        Price: "9.90",
      },
    ],
  })
  @IsArray()
  records: Record<string, unknown>[];

  @ApiPropertyOptional({
    description: "Whether to create bucket if it does not exist",
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? true : value))
  create_bucket: boolean = true;
}
