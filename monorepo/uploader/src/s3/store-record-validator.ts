import { BadRequestException, Injectable } from "@nestjs/common";

@Injectable()
export class StoreRecordValidator {
  private readonly REQUIRED_FIELDS = [
    "ChainId",
    "SubChainId",
    "StoreId",
    //"BikoretNo",
    //"StoreType",
    "ChainName",
    "SubChainName",
    "StoreName",
    //"Address",
    //"City",
    //"ZipCode",
    "LastUpdateDate",
  ] as const;

  validateRecords(records: Record<string, unknown>[]): void {
    if (!records || records.length === 0) {
      throw new BadRequestException("Records array cannot be empty");
    }

    for (let i = 0; i < records.length; i++) {
      const record = records[i];

      for (const field of this.REQUIRED_FIELDS) {
        if (record[field] === undefined || record[field] === null) {
          throw new BadRequestException(
            `Record at index ${i} is missing required field: ${field}`,
          );
        }

        const value = String(record[field]).trim();
        if (value === "") {
          throw new BadRequestException(
            `Record at index ${i} has empty value for required field: ${field}`,
          );
        }
      }

      const dateValue = new Date(String(record.LastUpdateDate));
      if (Number.isNaN(dateValue.getTime())) {
        throw new BadRequestException(
          `Record at index ${i} has invalid LastUpdateDate: ${String(record.LastUpdateDate)}`,
        );
      }
    }

    this.validateChainIntegrity(records);
  }

  private validateChainIntegrity(records: Record<string, unknown>[]): void {
    if (records.length < 2) {
      return;
    }

    const expectedChainId = String(records[0].ChainId);

    for (let i = 1; i < records.length; i++) {
      if (String(records[i].ChainId) !== expectedChainId) {
        throw new BadRequestException(
          `Group integrity violation: Record at index ${i} has a different ChainId. Expected ChainId=${expectedChainId}, got ChainId=${String(records[i].ChainId)}`,
        );
      }
    }
  }
}