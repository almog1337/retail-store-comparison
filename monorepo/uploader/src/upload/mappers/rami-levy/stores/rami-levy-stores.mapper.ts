import { Injectable, Logger } from "@nestjs/common";
import { StoreUpsertRecord } from "../../../../database/repositories/data.repository.interface";
import { IStoreMapper } from "../../abstractions/stores/store-mapper.interface";
import { RamiLevyStore } from "./rami-levy-stores.interface";

@Injectable()
export class RamiLevyStoreMapper implements IStoreMapper {
  private readonly logger = new Logger(RamiLevyStoreMapper.name);

  mapToStores(records: Record<string, unknown>[]): StoreUpsertRecord[] {
    return records
      .map((record) => this.extractStoreFields(record))
      .filter((store): store is StoreUpsertRecord => store !== null);
  }

  private extractStoreFields(record: Record<string, unknown>): StoreUpsertRecord | null {
    const chainExternalId = this.getStringField(record, "ChainId");
    const storeExternalId = this.getNumberAsStringField(record, "StoreId");
    const name = this.getStringField(record, "StoreName");
    const city = this.getStringField(record, "City");
    const address = this.getStringField(record, "Address");
    const storeType = this.getStringField(record, "StoreType");

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

  private getStringField(
    record: Record<string, unknown>,
    fieldName: keyof RamiLevyStore,
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

  private getNumberAsStringField(
    record: Record<string, unknown>,
    fieldName: keyof RamiLevyStore,
  ): string | null {
    const value = record[fieldName];

    if (typeof value === "string") {
      return Number(value).toString();
    }

    if (typeof value === "number") {
      return value.toString();
    }

    return null;
  }
}
