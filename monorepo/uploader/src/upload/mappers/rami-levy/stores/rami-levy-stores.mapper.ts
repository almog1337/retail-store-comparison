import { Injectable, Logger } from "@nestjs/common";
import { StoreUpsertRecord } from "../../../../database/repositories/data.repository.interface";
import { IStoreMapper } from "../../abstractions/stores/store-mapper.interface";
import { ParsingHelpers } from "../../abstractions/prices/parsing-helpers";
import { RamiLevyStore } from "./rami-levy-stores.interface";

@Injectable()
export class RamiLevyStoreMapper implements IStoreMapper {
  private readonly logger = new Logger(RamiLevyStoreMapper.name);

  constructor(private readonly parsingHelpers: ParsingHelpers) {}

  mapToStores(records: Record<string, unknown>[]): StoreUpsertRecord[] {
    return records
      .map((record) => this.extractStoreFields(record))
      .filter((store): store is StoreUpsertRecord => store !== null);
  }

  private extractStoreFields(record: Record<string, unknown>): StoreUpsertRecord | null {
    const chainExternalId = this.parsingHelpers.getStringField(record, "ChainId");
    const storeExternalId = this.parsingHelpers.getNumberAsStringField(record, "StoreId");
    const name = this.parsingHelpers.getStringField(record, "StoreName");
    const city = this.parsingHelpers.getStringField(record, "City");
    const address = this.parsingHelpers.getStringField(record, "Address");
    const storeType = this.parsingHelpers.getStringField(record, "StoreType");

    if (!chainExternalId || !storeExternalId || !name) {
      this.logger.warn(
        `[RamiLevy stores] Skipping record missing required fields (ChainId, StoreId, StoreName): ${JSON.stringify(record)}`,
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
