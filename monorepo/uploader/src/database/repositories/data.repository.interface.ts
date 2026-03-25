import { Chain, NewChain, NewProduct, NewProductIdentifier } from "../schema";

export const DATA_REPOSITORY = Symbol("DATA_REPOSITORY");

export interface DataSourceInsert {
  chainExternalId: string;
  fileName: string;
  sourceUrl?: string;
  fileType?: string;
  publishedAt?: Date;
  scrapedAt?: Date;
}

export interface PriceEventInsert {
  price: string;
  unit_price?: string;
  published_at?: Date;
}

export interface ProductSpecInsert {
  is_weighted?: boolean;
  base_quantity?: string;
  base_unit?: string;
  attributes?: Record<string, unknown[]>;
}

export interface ProductWithIdentifierRecord {
  product: NewProduct;
  identifier: Omit<NewProductIdentifier, "product_id">;
  chainExternalId: string;
  storeExternalId: string;
  priceEvent?: PriceEventInsert;
  productSpec?: ProductSpecInsert;
}

export interface StoreUpsertRecord {
  chainExternalId: string;
  sourceId?: number;
  store: {
    store_external_id: string;
    name?: string | null;
    city?: string | null;
    address?: string | null;
    latitude?: string | number | null;
    longitude?: string | number | null;
    store_type?: string | null;
    is_active?: boolean | null;
  };
}

export interface IDataRepository {
  insertProducts(records: NewProduct[]): Promise<void>;
  insertProductsWithIdentifiers(records: ProductWithIdentifierRecord[]): Promise<void>;
  insertProductsWithPriceData(records: ProductWithIdentifierRecord[], sourceId: number): Promise<void>;
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
