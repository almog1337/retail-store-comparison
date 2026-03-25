import { Injectable, Logger } from "@nestjs/common";
import { ProductWithIdentifierRecord } from "../../../../database/repositories/data.repository.interface";
import { IRecordMapper } from "../../abstractions/prices/record-mapper.interface";
import { ParsingHelpers } from "../../abstractions/prices/parsing-helpers";
import { ShufersalRecord } from "./shufersal-record.interface";

/**
 * Mapper for Shufersal pipeline records.
 * Extracts ItemName (as name) and Price from Shufersal XML parser output.
 */
@Injectable()
export class ShufersalRecordMapper implements IRecordMapper {
  private readonly logger = new Logger(ShufersalRecordMapper.name);

  constructor(private readonly parsingHelpers: ParsingHelpers) {}

  mapToProductsWithIdentifiers(
    records: Record<string, unknown>[],
  ): ProductWithIdentifierRecord[] {
    return records
      .map((record) => this.extractProductFields(record))
      .filter((product): product is ProductWithIdentifierRecord => product !== null);
  }

  private extractProductFields(
    record: Record<string, unknown>,
  ): ProductWithIdentifierRecord | null {
    const name = this.parsingHelpers.getStringField(record, "ItemName");
    const itemCode = this.parsingHelpers.getStringField(record, "ItemCode");
    const chainExternalId = this.parsingHelpers.getStringField(record, "ChainId");
    const storeExternalId = this.parsingHelpers.getNumberAsStringField(record, "StoreId");
    const description =
      this.parsingHelpers.getStringField(record, "ManufacturerItemDescription") || name;

    const itemPrice = this.parsingHelpers.getStringField(record, "ItemPrice");

    if (!name || !itemCode || !chainExternalId || !storeExternalId || !itemPrice) {
      this.logger.warn(
        `[Shufersal] Skipping record missing required fields (ItemName, ItemCode, ChainId, StoreId, ItemPrice): ${JSON.stringify(record)}`,
      );
      return null;
    }

    const priceUpdateDate = this.parsingHelpers.getStringField(record, "PriceUpdateDate");

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
          this.parsingHelpers.getStringField(record, "UnitOfMeasurePrice") ?? undefined,
        published_at: priceUpdateDate ? new Date(priceUpdateDate) : undefined,
      },
      productSpec: {
        is_weighted: this.parsingHelpers.getStringField(record, "bIsWeighted") === "1",
        base_quantity:
          this.parsingHelpers.getStringField(record, "Quantity") ?? undefined,
        base_unit:
          this.parsingHelpers.getStringField(record, "UnitOfMeasure") ?? undefined,
        attributes: this.buildSpecAttributes(record),
      },
    };
  }

  private buildSpecAttributes(
    record: Record<string, unknown>,
  ): Record<string, unknown[]> {
    const attrs: Record<string, unknown[]> = {};
    const manufacturerName = this.parsingHelpers.getStringField(
      record,
      "ManufacturerName",
    );
    if (manufacturerName) attrs.manufacturer_name = [manufacturerName];
    const manufactureCountry = this.parsingHelpers.getStringField(
      record,
      "ManufactureCountry",
    );
    if (manufactureCountry) attrs.manufacture_country = [manufactureCountry];
    const itemType = this.parsingHelpers.getStringField(record, "ItemType");
    if (itemType) attrs.item_type = [itemType];
    const unitQty = this.parsingHelpers.getStringField(record, "UnitQty");
    if (unitQty) attrs.unit_qty_description = [unitQty];
    const qtyInPackage = this.parsingHelpers.getStringField(record, "QtyInPackage");
    if (qtyInPackage) attrs.qty_in_package = [qtyInPackage];
    return attrs;
  }
}
