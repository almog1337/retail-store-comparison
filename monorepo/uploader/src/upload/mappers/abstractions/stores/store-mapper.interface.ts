import { StoreUpsertRecord } from "../../../../database/repositories/data.repository.interface";

/**
 * Interface for pipeline-specific store mappers.
 */
export interface IStoreMapper {
	/**
	 * Maps scraper store records to repository-ready store rows.
	 */
	mapToStores(records: Record<string, unknown>[]): StoreUpsertRecord[];
}
