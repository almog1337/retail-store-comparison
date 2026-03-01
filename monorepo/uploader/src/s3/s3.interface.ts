export const S3_BACKEND = "S3_BACKEND";

export interface IS3Backend {
  uploadRecords(
    records: Record<string, unknown>[],
    key: string,
    createBucket: boolean,
  ): Promise<void>;
}
