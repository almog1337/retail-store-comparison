import { Injectable } from "@nestjs/common";

@Injectable()
export class ParsingHelpers {
  getStringField(record: Record<string, unknown>, fieldName: string): string | null {
    const value = record[fieldName];
    if (typeof value === "string") {
      return value;
    }
    if (typeof value === "number") {
      return String(value);
    }
    return null;
  }

  getNumberAsStringField(
    record: Record<string, unknown>,
    fieldName: string,
  ): string | null {
    const value = record[fieldName];
    if (typeof value === "string") {
      return Number(value).toString();
    }
    if (typeof value === "number") {
      return value.toString();
    }
    return null;
  }
}
