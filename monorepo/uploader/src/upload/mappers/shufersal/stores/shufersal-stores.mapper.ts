import { Injectable, Logger } from "@nestjs/common";
import { StoreUpsertRecord } from "../../../../database/repositories/data.repository.interface";
import { IStoreMapper } from "../../abstractions/stores/store-mapper.interface";
import { ShufersalStore } from "./shufersal-stores.interface";

/**
 * Mapper for Shufersal pipeline records.
 * Extracts ItemName (as name) and Price from Shufersal XML parser output.
 */
@Injectable()
export class ShufersalStoreMapper implements IStoreMapper {
  private readonly logger = new Logger(ShufersalStoreMapper.name);

  mapToStores(
    records: Record<string, ShufersalStore>[],
  ): StoreUpsertRecord[] {
    return records
      .map((record) => this.extractStoreFields(record))
      .filter((store): store is StoreUpsertRecord => store !== null);
  }

  private extractStoreFields(
    record: Record<string, ShufersalStore>,
  ): StoreUpsertRecord | null {
    const chainExternalId = this.getStringField(record, "ChainId");
    const storeExternalId = this.getStringField(record, "StoreId");
    const name = this.getStringField(record, "StoreName");
    const city = this.getStringField(record, "City");
    const address = this.getStringField(record, "Address");
    const storeType = this.getStringField(record, "StoreType");

    if (!chainExternalId || !storeExternalId || !name) {
      this.logger.warn(
        `[Shufersal stores] Skipping record missing required fields (ChainId, StoreId, StoreName): ${JSON.stringify(record)}`,
      );
      return null;
    }

    return {
      chainExternalId,
      store: {
        store_external_id: storeExternalId,
        name,
        city: city ?? null,
        address: address ?? null,
        store_type: storeType ?? null,
      },
    };
  }

  private getStringField(
    record: Record<string, ShufersalStore>,
    fieldName: keyof ShufersalStore,
  ): string | null {
    const value = record[fieldName];
    if (typeof value === "string") {
      return value;
    }
    if (typeof value === "number") {
      return String(value);
    }
    return null;
  }
}
