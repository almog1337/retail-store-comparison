import { Chain, NewChain, NewProduct, NewProductIdentifier, NewStore } from "../schema";

export const DATA_REPOSITORY = Symbol("DATA_REPOSITORY");

export interface DataSourceInsert {
  chainExternalId: string;
  fileName: string;
  sourceUrl?: string;
  fileType?: string;
  publishedAt?: Date;
  scrapedAt?: Date;
}

export interface ProductWithIdentifierRecord {
  product: NewProduct;
  identifier: Omit<NewProductIdentifier, "product_id">;
  chainExternalId: string;
  storeExternalId: string;
}

export interface StoreUpsertRecord {
  chainExternalId: string;
  sourceId?: number;
  store: Omit<NewStore, "id" | "chain_id" | "source_id" | "created_at">;
}

export interface IDataRepository {
  insertProducts(records: NewProduct[]): Promise<void>;
  insertProductsWithIdentifiers(records: ProductWithIdentifierRecord[]): Promise<void>;
  insertStores(records: StoreUpsertRecord[]): Promise<void>;
  insertDataSource(record: DataSourceInsert): Promise<{ id: number }>;
  getChains(): Promise<Chain[]>;
  insertChain(record: NewChain): Promise<Chain>;
  updateChain(
    id: number,
    updates: Partial<Pick<NewChain, "external_id" | "name">>,
  ): Promise<Chain | null>;
  deleteChain(id: number): Promise<boolean>;
}
