import { Inject, Injectable } from '@nestjs/common';
import { IStorageBackend, STORAGE_BACKEND } from '../storage/storage.interface';
import { UploadRecordsDto } from './dto/upload-records.dto';

@Injectable()
export class UploadService {
  constructor(
    @Inject(STORAGE_BACKEND) private readonly storage: IStorageBackend,
  ) {}

  async uploadRecords(dto: UploadRecordsDto): Promise<void> {
    await this.storage.uploadRecords(dto.records, dto.key, dto.create_bucket);
  }
}
