import { Injectable, Logger } from "@nestjs/common";
import { StoreUpsertRecord } from "../../../../database/repositories/data.repository.interface";
import { IStoreMapper } from "../../abstractions/stores/store-mapper.interface";
import { ParsingHelpers } from "../../abstractions/prices/parsing-helpers";
import { ShufersalStore } from "./shufersal-stores.interface";

/**
 * Mapper for Shufersal pipeline records.
 * Extracts ItemName (as name) and Price from Shufersal XML parser output.
 */
@Injectable()
export class ShufersalStoreMapper implements IStoreMapper {
  private readonly logger = new Logger(ShufersalStoreMapper.name);

  constructor(private readonly parsingHelpers: ParsingHelpers) {}

  mapToStores(records: Record<string, ShufersalStore>[]): StoreUpsertRecord[] {
    return records
      .map((record) => this.extractStoreFields(record))
      .filter((store): store is StoreUpsertRecord => store !== null);
  }

  private extractStoreFields(
    record: Record<string, ShufersalStore>,
  ): StoreUpsertRecord | null {
    const chainExternalId = this.parsingHelpers.getStringField(record, "ChainId");
    const storeExternalId = this.parsingHelpers.getStringField(record, "StoreId");
    const name = this.parsingHelpers.getStringField(record, "StoreName");
    const city = this.parsingHelpers.getStringField(record, "City");
    const address = this.parsingHelpers.getStringField(record, "Address");
    const storeType = this.parsingHelpers.getStringField(record, "StoreType");

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
}
