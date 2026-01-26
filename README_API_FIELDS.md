# Shufersal Open Price API Field Explanations

This document explains the fields returned by the Shufersal Open Price API, which follows the Israeli Ministry of Economy's Prices Transparency regulations for supermarket chains.

## Store & Chain Information

- **ChainId**: Unique identifier for the retail chain (7290027600007 = Shufersal)
- **SubChainId**: Sub-chain identifier (001 = specific Shufersal brand, e.g., Shufersal Sheli, Deal, etc.)
- **StoreId**: Specific store branch identifier
- **BikoretNo**: Store's "Bikuret" inspection number (Israeli health ministry inspection number)

## System Information

- **DllVerNo**: Version number of the data export system
- **PriceUpdateDate**: Date and time when the price was last updated

## Product Information

- **ItemCode**: Barcode/product identifier (EAN/UPC code)
- **ItemType**: Product type (1 = regular item, 0 = promotional/special)
- **ItemName**: Product name in Hebrew
- **ManufacturerName**: Manufacturer/supplier name
- **ManufactureCountry**: Country of manufacture (e.g., "IL" = Israel)
- **ManufacturerItemDescription**: Manufacturer's description of the item

## Pricing & Quantity

- **UnitQty**: Unit of measurement description
- **Quantity**: Base quantity
- **bIsWeighted**: Whether item is sold by weight (0 = no, 1 = yes)
- **UnitOfMeasure**: Unit of measurement (e.g., יחידה = unit/piece, ק"ג = kilogram)
- **QtyInPackage**: Quantity per package
- **ItemPrice**: Price per item (in ILS)
- **UnitOfMeasurePrice**: Price per unit of measure (in ILS)

## Additional Attributes

- **AllowDiscount**: Whether discounts are allowed (1 = yes, 0 = no)
- **ItemStatus**: Item availability status (1 = active/available)
- **ItemsCount**: Number of items in this record set

## Example Record

```json
{
  "ChainId": "7290027600007",
  "SubChainId": "001",
  "StoreId": "001",
  "BikoretNo": "9",
  "DllVerNo": "8.0.1.3",
  "PriceUpdateDate": "2026-01-21 11:22",
  "ItemCode": "710497504904",
  "ItemType": "1",
  "ItemName": "רוזמרין יחידה",
  "ManufacturerName": "משק מלר",
  "ManufactureCountry": "IL",
  "ManufacturerItemDescription": "רוזמרין יחידה",
  "UnitQty": "יחידה",
  "Quantity": "1.00",
  "bIsWeighted": "0",
  "UnitOfMeasure": "יחידה",
  "QtyInPackage": "1",
  "ItemPrice": "8.90",
  "UnitOfMeasurePrice": "8.90",
  "AllowDiscount": "1",
  "ItemStatus": "1",
  "ItemsCount": "13"
}
```

This example shows a rosemary unit (רוזמרין יחידה) from Meller Farm (משק מלר), priced at 8.90 ILS per unit.
