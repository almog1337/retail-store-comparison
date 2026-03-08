import { IsArray, IsBoolean, IsIn, IsOptional, IsString } from "class-validator";
import { Transform } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ALLOWED_PIPELINE_NAMES } from "../constants/pipeline-names.constant";

export class UploadRecordsDto {
  @ApiProperty({
    description:
      "Pipeline name for organizing data in storage hierarchy. Must be one of the allowed pipeline names.",
    example: "shufersal_stores",
    enum: ALLOWED_PIPELINE_NAMES,
  })
  @IsString()
  @IsIn(ALLOWED_PIPELINE_NAMES, {
    message: `pipeline_name must be one of the following values: ${ALLOWED_PIPELINE_NAMES.join(", ")}`,
  })
  pipeline_name: string;

  @ApiProperty({
    description:
      "Records to upload as JSON array. The required fields depend on pipeline type (prices vs stores).",
    type: "array",
    example: [
      {
        ChainId: "7290027600007",
        SubChainId: "1",
        StoreId: "123",
        BikoretNo: "456",
        StoreType: "city",
        ChainName: "Shufersal",
        SubChainName: "Deal",
        StoreName: "Main Branch",
        Address: "1 Herzl St",
        City: "Tel Aviv",
        ZipCode: "6100001",
        LastUpdateDate: "2026-03-01T10:00:00Z",
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
