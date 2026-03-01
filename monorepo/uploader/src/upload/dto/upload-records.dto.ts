import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadRecordsDto {
  @ApiProperty({
    description: 'Object key (path/filename) inside the target bucket',
    example: 'prices/2026-03-01.json',
  })
  @IsString()
  key: string;

  @ApiProperty({
    description: 'Records to upload as JSON array',
    type: 'array',
    example: [{ chain: 'store-a', item_code: '12345', price: 9.9 }],
  })
  @IsArray()
  records: Record<string, unknown>[];

  @ApiPropertyOptional({
    description: 'Whether to create bucket if it does not exist',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? true : value))
  create_bucket: boolean = true;
}
