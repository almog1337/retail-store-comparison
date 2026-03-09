import { Injectable, Logger } from "@nestjs/common";
import { ProductWithIdentifierRecord } from "../../../../database/repositories/data.repository.interface";
import { IRecordMapper } from "../../abstractions/prices/record-mapper.interface";
import { ShufersalRecord } from "./shufersal-record.interface";

/**
 * Mapper for Shufersal pipeline records.
 * Extracts ItemName (as name) and Price from Shufersal XML parser output.
 */
@Injectable()
export class ShufersalRecordMapper implements IRecordMapper {
  private readonly logger = new Logger(ShufersalRecordMapper.name);

  mapToProductsWithIdentifiers(
    records: Record<string, unknown>[],
  ): ProductWithIdentifierRecord[] {
    return records
      .map((record) => this.extractProductFields(record))
      .filter(
        (product): product is ProductWithIdentifierRecord => product !== null,
      );
  }

  private extractProductFields(
    record: Record<string, unknown>,
  ): ProductWithIdentifierRecord | null {
    const name = this.getStringField(record, "ItemName");
    const itemCode = this.getStringField(record, "ItemCode");
    const chainExternalId = this.getStringField(record, "ChainId");
    const storeExternalId = this.getNumberAsStringField(record, "StoreId");
    const description = this.getStringField(record, "ManufacturerItemDescription") || name;

    if (!name || !itemCode || !chainExternalId || !storeExternalId) {
      this.logger.warn(
        `[Shufersal] Skipping record missing required fields (ItemName, ItemCode, ChainId, StoreId): ${JSON.stringify(record)}`,
      );
      return null;
    }

    return {
      product: {
        canonical_name: name,
      },
      identifier: {
        description,
        external_code: itemCode,
      },
      chainExternalId,
      storeExternalId,
    };
  }

  private getStringField(
    record: Record<string, unknown>,
    fieldName: keyof ShufersalRecord,
  ): string | null {
    const value = record[fieldName];
    if (typeof value === "string") {
      return value;
    }
    return null;
  }

  // This is for a text field which represents a number, think of a better name for this method
  private getNumberAsStringField(
    record: Record<string, unknown>,
    fieldName: keyof ShufersalRecord): string | null {
    const value = record[fieldName];
    if (typeof value === "string") {
      return Number(value).toString();
    }
    return null;
  }
}
