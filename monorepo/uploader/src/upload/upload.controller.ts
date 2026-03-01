import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UploadRecordsDto } from './dto/upload-records.dto';
import { UploadService } from './upload.service';
import { ApiKeyGuard } from './guards/api-key.guard';

@Controller('minio')
@ApiTags('minio')
@ApiBearerAuth()
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @HttpCode(200)
  @UseGuards(ApiKeyGuard)
  @ApiOperation({ summary: 'Upload records to object storage' })
  @ApiBody({ type: UploadRecordsDto })
  @ApiOkResponse({
    description: 'Records uploaded successfully',
    schema: {
      example: { status: 'uploaded', key: 'prices/2026-03-01.json', records: 120 },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Authorization header' })
  @ApiForbiddenResponse({ description: 'Invalid API key' })
  async upload(@Body() dto: UploadRecordsDto) {
    await this.uploadService.uploadRecords(dto);
    return { status: 'uploaded', key: dto.key, records: dto.records.length };
  }
}
