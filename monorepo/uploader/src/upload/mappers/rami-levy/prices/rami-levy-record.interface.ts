/**
 * Represents a product item from the Rami Levy retail system.
 * Same government-mandated XML format as Shufersal.
 */
export interface RamiLevyRecord {
  ChainId: string;
  SubChainId: string;
  StoreId: string;
  BikoretNo: string;
  DllVerNo: string;
  PriceUpdateDate: string;
  ItemCode: string;
  ItemType: string;
  ItemName: string;
  ManufacturerName: string;
  ManufactureCountry: string;
  ManufacturerItemDescription: string;
  UnitQty: string;
  Quantity: string;
  bIsWeighted: string;
  UnitOfMeasure: string;
  QtyInPackage: string;
  ItemPrice: string;
  UnitOfMeasurePrice: string;
  AllowDiscount: string;
  ItemStatus: string;
  ItemsCount: string;
}
