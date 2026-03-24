import { IsArray, IsBoolean, IsIn, IsOptional, IsString, ValidateNested } from "class-validator";
import { Transform, Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ALLOWED_PIPELINE_NAMES } from "../constants/pipeline-names.constant";

export class SourceMetadataDto {
  @ApiProperty({ description: "Original file name from the scraped source", example: "PriceFull7290027600007-001-201912161530.gz" })
  @IsString()
  file_name: string;

  @ApiPropertyOptional({ description: "URL the file was downloaded from", example: "https://prices.shufersal.co.il/FileObject/UpdateCategory?catID=2&storeId=0&file.gz" })
  @IsString()
  @IsOptional()
  source_url?: string;

  @ApiPropertyOptional({ description: "Publication date from the source (ISO string)", example: "2026-03-24T10:30:00.000Z" })
  @IsString()
  @IsOptional()
  published_at?: string;

  @ApiPropertyOptional({ description: "Timestamp when the file was scraped (ISO string)", example: "2026-03-24T12:00:00.000Z" })
  @IsString()
  @IsOptional()
  scraped_at?: string;
}

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
      "Records to upload as JSON array. The required fields depend on pipeline type (prices vs stores).",
    type: "array",
    example: [
      {
        ChainId: "7290027600007",
        SubChainId: "1",
        StoreId: "123",
        BikoretNo: "456",
        ItemCode: "7290000000001",
        ItemName: "חלב תנובה 3% 1 ליטר",
        ItemPrice: "6.90",
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

  @ApiPropertyOptional({
    description: "Source file metadata for data_sources tracking",
    example: {
      file_name: "PriceFull7290027600007-001-201912161530.gz",
      source_url: "https://prices.shufersal.co.il/FileObject/UpdateCategory?catID=2&storeId=0&file.gz",
      published_at: "2026-03-24T10:30:00.000Z",
      scraped_at: "2026-03-24T12:00:00.000Z",
    },
  })
  @ValidateNested()
  @Type(() => SourceMetadataDto)
  @IsOptional()
  source_metadata?: SourceMetadataDto;
}
