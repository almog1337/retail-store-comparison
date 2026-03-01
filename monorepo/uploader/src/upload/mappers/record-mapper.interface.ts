import { NewProduct } from "../../database/schema";

/**
 * Interface for pipeline-specific record mappers.
 * Each pipeline (Shufersal, Tiv Taam, etc.) can have its own mapper
 * to extract fields from their specific scraper output format.
 */
export interface IRecordMapper {
  /**
   * Maps scraper records to PostgreSQL product records.
   * @param records - Raw scraper records with dynamic fields
   * @returns Array of products with whitelisted fields
   */
  mapToProducts(records: Record<string, unknown>[]): NewProduct[];
}
