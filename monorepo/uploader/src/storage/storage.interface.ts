export const STORAGE_BACKEND = 'STORAGE_BACKEND';

export interface IStorageBackend {
  uploadRecords(
    records: Record<string, unknown>[],
    key: string,
    createBucket: boolean,
  ): Promise<void>;
}
