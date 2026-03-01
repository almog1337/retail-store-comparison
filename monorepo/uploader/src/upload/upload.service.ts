import { Inject, Injectable } from "@nestjs/common";
import { IS3Backend, S3_BACKEND } from "../s3/s3.interface";
import {
  IDataRepository,
  DATA_REPOSITORY,
} from "../database/repositories/data.repository.interface";
import { UploadRecordsDto } from "./dto/upload-records.dto";
import { RecordValidator } from "../s3/record-validator";
import { KeyGenerator } from "../s3/key-generator";
import { RecordMapperFactory } from "./mappers/record-mapper.factory";

@Injectable()
export class UploadService {
  constructor(
    @Inject(S3_BACKEND) private readonly storage: IS3Backend,
    @Inject(DATA_REPOSITORY) private readonly dataRepository: IDataRepository,
    private readonly recordValidator: RecordValidator,
    private readonly keyGenerator: KeyGenerator,
    private readonly recordMapperFactory: RecordMapperFactory,
  ) {}

  async uploadRecords(dto: UploadRecordsDto): Promise<{ key: string }> {
    // Validate records have required fields and group integrity
    this.recordValidator.validateRecords(dto.records);

    // Generate storage key based on pipeline name and record metadata
    const key = this.keyGenerator.generateKey({
      pipelineName: dto.pipeline_name,
      records: dto.records,
    });

    // Upload raw records to storage (data lake - keep everything as-is)
    await this.storage.uploadRecords(dto.records, key, dto.create_bucket);

    // Get the appropriate mapper for this pipeline and map records for PostgreSQL
    const mapper = this.recordMapperFactory.getMapper(dto.pipeline_name);
    const products = mapper.mapToProducts(dto.records);
    await this.dataRepository.insertProducts(products);

    // Return the generated key so caller knows where data was stored
    return { key };
  }
}
