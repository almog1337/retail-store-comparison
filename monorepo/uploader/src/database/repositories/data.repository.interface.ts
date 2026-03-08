import { Chain, NewChain, NewProduct, NewProductIdentifier, NewStore } from "../schema";

export const DATA_REPOSITORY = Symbol("DATA_REPOSITORY");

export interface ProductWithIdentifierRecord {
  product: NewProduct;
  identifier: Omit<NewProductIdentifier, "product_id">;
}

export interface StoreUpsertRecord {
  chainExternalId: string;
  store: Omit<NewStore, "id" | "chain_id" | "created_at">;
}

export interface IDataRepository {
  insertProducts(records: NewProduct[]): Promise<void>;
  insertProductsWithIdentifiers(records: ProductWithIdentifierRecord[]): Promise<void>;
  insertStores(records: StoreUpsertRecord[]): Promise<void>;
  getChains(): Promise<Chain[]>;
  insertChain(record: NewChain): Promise<Chain>;
  updateChain(
    id: number,
    updates: Partial<Pick<NewChain, "external_id" | "name">>,
  ): Promise<Chain | null>;
  deleteChain(id: number): Promise<boolean>;
}
