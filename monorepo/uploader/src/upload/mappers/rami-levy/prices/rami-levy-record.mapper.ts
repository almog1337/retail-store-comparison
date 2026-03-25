import { Injectable, Logger } from "@nestjs/common";
import { ProductWithIdentifierRecord } from "../../../../database/repositories/data.repository.interface";
import { IRecordMapper } from "../../abstractions/prices/record-mapper.interface";
import { RamiLevyRecord } from "./rami-levy-record.interface";

@Injectable()
export class RamiLevyRecordMapper implements IRecordMapper {
  private readonly logger = new Logger(RamiLevyRecordMapper.name);

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
    const description =
      this.getStringField(record, "ManufacturerItemDescription") || name;

    const itemPrice = this.getStringField(record, "ItemPrice");

    if (
      !name ||
      !itemCode ||
      !chainExternalId ||
      !storeExternalId ||
      !itemPrice
    ) {
      this.logger.warn(
        `[RamiLevy] Skipping record missing required fields (ItemName, ItemCode, ChainId, StoreId, ItemPrice): ${JSON.stringify(record)}`,
      );
      return null;
    }

    const priceUpdateDate = this.getStringField(record, "PriceUpdateDate");

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
      priceEvent: {
        price: itemPrice,
        unit_price:
          this.getStringField(record, "UnitOfMeasurePrice") ?? undefined,
        published_at: priceUpdateDate
          ? new Date(priceUpdateDate)
          : undefined,
      },
      productSpec: {
        is_weighted: this.getStringField(record, "bIsWeighted") === "1",
        base_quantity: this.getStringField(record, "Quantity") ?? undefined,
        base_unit: this.getStringField(record, "UnitOfMeasure") ?? undefined,
        attributes: this.buildSpecAttributes(record),
      },
    };
  }

  private getStringField(
    record: Record<string, unknown>,
    fieldName: keyof RamiLevyRecord,
  ): string | null {
    const value = record[fieldName];
    if (typeof value === "string") {
      return value;
    }
    return null;
  }

  private buildSpecAttributes(
    record: Record<string, unknown>,
  ): Record<string, unknown[]> {
    const attrs: Record<string, unknown[]> = {};
    const manufacturerName = this.getStringField(record, "ManufacturerName");
    if (manufacturerName) attrs.manufacturer_name = [manufacturerName];
    const manufactureCountry = this.getStringField(
      record,
      "ManufactureCountry",
    );
    if (manufactureCountry) attrs.manufacture_country = [manufactureCountry];
    const itemType = this.getStringField(record, "ItemType");
    if (itemType) attrs.item_type = [itemType];
    const unitQty = this.getStringField(record, "UnitQty");
    if (unitQty) attrs.unit_qty_description = [unitQty];
    const qtyInPackage = this.getStringField(record, "QtyInPackage");
    if (qtyInPackage) attrs.qty_in_package = [qtyInPackage];
    return attrs;
  }

  private getNumberAsStringField(
    record: Record<string, unknown>,
    fieldName: keyof RamiLevyRecord,
  ): string | null {
    const value = record[fieldName];
    if (typeof value === "string") {
      return Number(value).toString();
    }
    return null;
  }
}
