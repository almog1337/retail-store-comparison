/**
 * Represents a Rami Levy store record, as scraped.
 * Same government-mandated XML format as Shufersal.
 */
export interface RamiLevyStore {
  ChainId: string;
  SubChainId: string;
  StoreId: string;
  BikoretNo: string;
  StoreType: string;
  ChainName: string;
  SubChainName: string;
  StoreName: string;
  Address: string;
  City: string;
  ZipCode: string;
  LastUpdateDate: string;
}
