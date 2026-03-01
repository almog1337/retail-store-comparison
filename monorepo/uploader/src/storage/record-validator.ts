import { Injectable, BadRequestException } from "@nestjs/common";

@Injectable()
export class RecordValidator {
  private readonly REQUIRED_FIELDS = ["SubChainId", "StoreId", "BikoretNo"];

  /**
   * Validates that all records contain required grouping fields and that
   * all records share the same values for these fields (integrity check).
   *
   * @param records - Array of records to validate
   * @throws BadRequestException if validation fails
   */
  validateRecords(records: Record<string, unknown>[]): void {
    if (!records || records.length === 0) {
      throw new BadRequestException("Records array cannot be empty");
    }

    // Check that all records have required fields
    for (let i = 0; i < records.length; i++) {
      const record = records[i];

      for (const field of this.REQUIRED_FIELDS) {
        if (record[field] === undefined || record[field] === null) {
          throw new BadRequestException(
            `Record at index ${i} is missing required field: ${field}`,
          );
        }

        // Ensure it's a meaningful value (not empty string)
        const value = String(record[field]).trim();
        if (value === "") {
          throw new BadRequestException(
            `Record at index ${i} has empty value for required field: ${field}`,
          );
        }
      }
    }

    // Integrity check: all records should have identical grouping field values
    // (since they should represent a single group sent from the scraper)
    this.validateGroupIntegrity(records);
  }

  /**
   * Ensures all records in the batch share the same SubChainId, StoreId, and BikoretNo.
   * This verifies that the scraper properly grouped records before sending.
   */
  private validateGroupIntegrity(records: Record<string, unknown>[]): void {
    if (records.length < 2) {
      return; // No need to check integrity for single record
    }

    const reference = records[0];
    const expectedSubChainId = reference.SubChainId;
    const expectedStoreId = reference.StoreId;
    const expectedBikoretNo = reference.BikoretNo;

    for (let i = 1; i < records.length; i++) {
      const record = records[i];

      if (
        record.SubChainId !== expectedSubChainId ||
        record.StoreId !== expectedStoreId ||
        record.BikoretNo !== expectedBikoretNo
      ) {
        throw new BadRequestException(
          `Group integrity violation: Record at index ${i} has different grouping fields. ` +
            `Expected SubChainId=${expectedSubChainId}, StoreId=${expectedStoreId}, BikoretNo=${expectedBikoretNo} ` +
            `but got SubChainId=${record.SubChainId}, StoreId=${record.StoreId}, BikoretNo=${record.BikoretNo}`,
        );
      }
    }
  }
}
