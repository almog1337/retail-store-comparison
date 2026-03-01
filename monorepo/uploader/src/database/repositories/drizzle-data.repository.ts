import { Injectable } from "@nestjs/common";
import { DrizzleService } from "../drizzle.service";
import { products, NewProduct } from "../schema";
import { IDataRepository } from "./data.repository.interface";

@Injectable()
export class DrizzleDataRepository implements IDataRepository {
  constructor(private readonly drizzleService: DrizzleService) {}

  async insertProducts(records: NewProduct[]): Promise<void> {
    if (records.length === 0) {
      return;
    }

    const db = this.drizzleService.getDb();
    await db.insert(products).values(records);
  }
}
