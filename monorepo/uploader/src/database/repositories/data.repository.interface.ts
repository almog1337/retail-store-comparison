import { NewProduct } from "../schema";

export const DATA_REPOSITORY = Symbol("DATA_REPOSITORY");

export interface IDataRepository {
  insertProducts(records: NewProduct[]): Promise<void>;
}
