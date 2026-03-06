import { Chain, NewChain, NewProduct, NewProductIdentifier } from "../schema";

export const DATA_REPOSITORY = Symbol("DATA_REPOSITORY");

export interface ProductWithIdentifierRecord {
  product: NewProduct;
  identifier: Omit<NewProductIdentifier, "product_id">;
}

export interface IDataRepository {
  insertProducts(records: NewProduct[]): Promise<void>;
  insertProductsWithIdentifiers(records: ProductWithIdentifierRecord[]): Promise<void>;
  getChains(): Promise<Chain[]>;
  insertChain(record: NewChain): Promise<Chain>;
  updateChain(id: number, updates: Partial<Pick<NewChain, "name">>): Promise<Chain | null>;
  deleteChain(id: number): Promise<boolean>;
}
