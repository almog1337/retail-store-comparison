import { Inject, Injectable } from "@nestjs/common";
import { IS3Backend, S3_BACKEND } from "../s3/s3.interface";
import {
  IDataRepository,
  DATA_REPOSITORY,
} from "../database/repositories/data.repository.interface";
import { UploadRecordsDto } from "./dto/upload-records.dto";
import { RecordValidator } from "../s3/record-validator";
import { StoreRecordValidator } from "../s3/store-record-validator";
import { KeyGenerator } from "../s3/key-generator";
import { RecordMapperFactory } from "./mappers/abstractions/prices/record-mapper.factory";
import { StoreMapperFactory } from "./mappers/abstractions/stores/store-mapper.factory";

@Injectable()
export class UploadService {
  constructor(
    @Inject(S3_BACKEND) private readonly storage: IS3Backend,
    @Inject(DATA_REPOSITORY) private readonly dataRepository: IDataRepository,
    private readonly recordValidator: RecordValidator,
    private readonly storeRecordValidator: StoreRecordValidator,
    private readonly keyGenerator: KeyGenerator,
    private readonly recordMapperFactory: RecordMapperFactory,
    private readonly storeMapperFactory: StoreMapperFactory,
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

    // Track data source if metadata provided
    if (dto.source_metadata) {
      const chainExternalId = String(dto.records[0]?.ChainId ?? "");
      await this.dataRepository.insertDataSource({
        chainExternalId,
        fileName: dto.source_metadata.file_name,
        sourceUrl: dto.source_metadata.source_url,
        fileType: "prices",
        publishedAt: dto.source_metadata.published_at
          ? new Date(dto.source_metadata.published_at)
          : undefined,
        scrapedAt: dto.source_metadata.scraped_at
          ? new Date(dto.source_metadata.scraped_at)
          : undefined,
      });
    }

    // Get the appropriate mapper for this pipeline and map records for PostgreSQL
    const mapper = this.recordMapperFactory.getMapper(dto.pipeline_name);
    const records = mapper.mapToProductsWithIdentifiers(dto.records);
    await this.dataRepository.insertProductsWithIdentifiers(records);

    // Return the generated key so caller knows where data was stored
    return { key };
  }

  async uploadStores(dto: UploadRecordsDto): Promise<{ key: string }> {
    this.storeRecordValidator.validateRecords(dto.records);

    const key = this.keyGenerator.generateStoresKey({
      pipelineName: dto.pipeline_name,
      records: dto.records,
    });

    await this.storage.uploadRecords(dto.records, key, dto.create_bucket);

    // Track data source if metadata provided
    let sourceId: number | undefined;
    if (dto.source_metadata) {
      const chainExternalId = String(dto.records[0]?.ChainId ?? "");
      const result = await this.dataRepository.insertDataSource({
        chainExternalId,
        fileName: dto.source_metadata.file_name,
        sourceUrl: dto.source_metadata.source_url,
        fileType: "stores",
        publishedAt: dto.source_metadata.published_at
          ? new Date(dto.source_metadata.published_at)
          : undefined,
        scrapedAt: dto.source_metadata.scraped_at
          ? new Date(dto.source_metadata.scraped_at)
          : undefined,
      });
      sourceId = result.id;
    }

    const mapper = this.storeMapperFactory.getMapper(dto.pipeline_name);
    const stores = mapper.mapToStores(dto.records);
    await this.dataRepository.insertStores(
      stores.map((s) => ({ ...s, sourceId })),
    );

    return { key };
  }
}
