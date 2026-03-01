import { Injectable } from "@nestjs/common";

export interface KeyGenerationParams {
  pipelineName: string;
  records: Record<string, unknown>[];
}

@Injectable()
export class KeyGenerator {
  /**
   * Generates a storage key for grouped records following the pattern:
   * bronze/{pipeline_name}/sub_chain_id={id}/store_id={id}/bikoret_no={id}/{timestamp}_parsed_records.txt
   *
   * @param params - Object containing pipeline name and records
   * @returns Generated storage key
   * @throws Error if records array is empty or missing required fields
   */
  generateKey(params: KeyGenerationParams): string {
    const { pipelineName, records } = params;

    if (!records || records.length === 0) {
      throw new Error("Cannot generate key: records array is empty");
    }

    // Extract grouping fields from first record (all records in group share these values)
    const firstRecord = records[0];
    const subChainId = firstRecord.SubChainId;
    const storeId = firstRecord.StoreId;
    const bikoretNo = firstRecord.BikoretNo;

    if (subChainId === undefined || storeId === undefined || bikoretNo === undefined) {
      throw new Error(
        "Cannot generate key: first record missing required fields (SubChainId, StoreId, BikoretNo)",
      );
    }

    // Generate timestamp in Python format: %Y-%m-%d_%H-%M-%S
    const now = new Date();
    const timestamp = this.formatTimestamp(now);

    // Construct key with Hive-style partitioning
    const key = `bronze/${pipelineName}/sub_chain_id=${subChainId}/store_id=${storeId}/bikoret_no=${bikoretNo}/${timestamp}_parsed_records.txt`;

    return key;
  }

  /**
   * Formats a date to match Python's strftime format: %Y-%m-%d_%H-%M-%S
   * Example: 2026-03-01_14-30-45
   */
  private formatTimestamp(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
  }
}
