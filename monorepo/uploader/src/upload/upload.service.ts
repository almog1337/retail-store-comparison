import { Inject, Injectable } from "@nestjs/common";
import { IStorageBackend, STORAGE_BACKEND } from "../storage/storage.interface";
import { UploadRecordsDto } from "./dto/upload-records.dto";
import { RecordValidator } from "../storage/record-validator";
import { KeyGenerator } from "../storage/key-generator";

@Injectable()
export class UploadService {
  constructor(
    @Inject(STORAGE_BACKEND) private readonly storage: IStorageBackend,
    private readonly recordValidator: RecordValidator,
    private readonly keyGenerator: KeyGenerator,
  ) {}

  async uploadRecords(dto: UploadRecordsDto): Promise<{ key: string }> {
    // Validate records have required fields and group integrity
    this.recordValidator.validateRecords(dto.records);

    // Generate storage key based on pipeline name and record metadata
    const key = this.keyGenerator.generateKey({
      pipelineName: dto.pipeline_name,
      records: dto.records,
    });

    // Upload to storage
    await this.storage.uploadRecords(dto.records, key, dto.create_bucket);

    // Return the generated key so caller knows where data was stored
    return { key };
  }
}
