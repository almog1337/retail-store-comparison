import { Body, Controller, HttpCode, Post, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { UploadRecordsDto } from "./dto/upload-records.dto";
import { UploadService } from "./upload.service";
import { ApiKeyGuard } from "./guards/api-key.guard";

@Controller("upload")
@ApiTags("upload")
@ApiBearerAuth()
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post("/prices")
  @HttpCode(200)
  @UseGuards(ApiKeyGuard)
  @ApiOperation({ summary: "Upload prices to object storage and PostgreSQL" })
  @ApiBody({ type: UploadRecordsDto })
  @ApiOkResponse({
    description:
      "Records uploaded successfully. Key is auto-generated based on pipeline name and record metadata.",
    schema: {
      example: {
        status: "uploaded",
        key: "bronze/shufersal/sub_chain_id=7290027600007/store_id=123/bikoret_no=456/2026-03-01_14-30-45_parsed_records.txt",
        records: 120,
      },
    },
  })
  @ApiUnauthorizedResponse({ description: "Missing or invalid Authorization header" })
  @ApiForbiddenResponse({ description: "Invalid API key" })
  async upload(@Body() dto: UploadRecordsDto) {
    const { key } = await this.uploadService.uploadRecords(dto);
    return { status: "uploaded", key, records: dto.records.length };
  }

  @Post("stores")
  @HttpCode(200)
  @UseGuards(ApiKeyGuard)
  @ApiOperation({ summary: "Upload store records to object storage and PostgreSQL" })
  @ApiBody({ type: UploadRecordsDto })
  @ApiOkResponse({
    description:
      "Store records uploaded successfully to object storage and persisted to stores table.",
    schema: {
      example: {
        status: "uploaded",
        key: "bronze/shufersal_stores/chain_id=7290027600007/2026-03-01_14-30-45_parsed_records.txt",
        records: 120,
      },
    },
  })
  @ApiUnauthorizedResponse({ description: "Missing or invalid Authorization header" })
  @ApiForbiddenResponse({ description: "Invalid API key" })
  async uploadStores(@Body() dto: UploadRecordsDto) {
    const { key } = await this.uploadService.uploadStores(dto);
    return { status: "uploaded", key, records: dto.records.length };
  }
}
