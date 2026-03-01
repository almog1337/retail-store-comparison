import { Injectable, Logger } from "@nestjs/common";
import { NewProduct } from "../../database/schema";
import { IRecordMapper } from "./record-mapper.interface";

/**
 * Mapper for Shufersal pipeline records.
 * Extracts ItemName (as name) and Price from Shufersal XML parser output.
 */
@Injectable()
export class ShufersalRecordMapper implements IRecordMapper {
  private readonly logger = new Logger(ShufersalRecordMapper.name);

  mapToProducts(records: Record<string, unknown>[]): NewProduct[] {
    return records
      .map((record) => this.extractProductFields(record))
      .filter((product): product is NewProduct => product !== null);
  }

  private extractProductFields(record: Record<string, unknown>): NewProduct | null {
    const name = this.getStringField(record, "ItemName");
    const price = this.getNumberField(record, "ItemPrice");

    if (!name || price === null) {
      this.logger.warn(
        `[Shufersal] Skipping record missing required fields (ItemName, Price): ${JSON.stringify(record)}`,
      );
      return null;
    }

    return {
      name,
      price,
    };
  }

  private getStringField(
    record: Record<string, unknown>,
    fieldName: string,
  ): string | null {
    const value = record[fieldName];
    if (typeof value === "string") {
      return value;
    }
    return null;
  }

  private getNumberField(
    record: Record<string, unknown>,
    fieldName: string,
  ): number | null {
    const value = record[fieldName];
    if (typeof value === "number") {
      return value;
    }
    if (typeof value === "string") {
      const parsed = parseFloat(value);
      if (!isNaN(parsed)) {
        return parsed;
      }
    }
    return null;
  }
}
