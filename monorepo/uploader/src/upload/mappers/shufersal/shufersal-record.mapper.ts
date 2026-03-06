import { Injectable, Logger } from "@nestjs/common";
import { ProductWithIdentifierRecord } from "../../../database/repositories/data.repository.interface";
import { IRecordMapper } from "../record-mapper.interface";
import { ShufersalRecord } from "./shufersal-record.interface";

/**
 * Mapper for Shufersal pipeline records.
 * Extracts ItemName (as name) and Price from Shufersal XML parser output.
 */
@Injectable()
export class ShufersalRecordMapper implements IRecordMapper {
  private readonly logger = new Logger(ShufersalRecordMapper.name);

  mapToProductsWithIdentifiers(
    records: Record<string, ShufersalRecord>[],
  ): ProductWithIdentifierRecord[] {
    return records
      .map((record) => this.extractProductFields(record))
      .filter(
        (product): product is ProductWithIdentifierRecord => product !== null,
      );
  }

  private extractProductFields(
    record: Record<string, ShufersalRecord>,
  ): ProductWithIdentifierRecord | null {
    const name = this.getStringField(record, "ItemName");
    const itemCode = this.getStringField(record, "ItemCode");
    const chainId = this.getStringField(record, "ChainId");
    const storeId = this.getStringField(record, "StoreId");
    //price_events published_at
    //TODO:: notify me that i need to validate the time format and correctness of parsing
    const publishedAt = new Date(this.getStringField(record, "PriceUpdateDate"));
    // product identifier description (the spesific one fo the store)
    const description = this.getStringField(record, "ManufacturerItemDescription") || "";
    const isWeighted = this.getStringField(record, "bIsWeighted") === "0" ? false : 
    this.getStringField(record, "bIsWeighted") === "1";

    

    if (!name || !itemCode) {
      this.logger.warn(
        `[Shufersal] Skipping record missing required fields (ItemName, ItemCode): ${JSON.stringify(record)}`,
      );
      return null;
    }

    return {
      product: {
        canonical_name: name,
      },
      identifier: {
        external_code: itemCode,
      },
    };
  }

  private getStringField(
    record: Record<string, ShufersalRecord>,
    fieldName: keyof ShufersalRecord,
  ): string | null {
    const value = record[fieldName];
    if (typeof value === "string") {
      return value;
    }
    return null;
  }

}
