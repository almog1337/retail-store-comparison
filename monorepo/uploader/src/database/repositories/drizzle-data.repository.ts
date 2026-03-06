import { Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { DrizzleService } from "../drizzle.service";
import {
  chains,
  Chain,
  NewChain,
  NewProduct,
  product_identifiers,
  products,
} from "../schema";
import {
  IDataRepository,
  ProductWithIdentifierRecord,
} from "./data.repository.interface";

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

  async insertProductsWithIdentifiers(
    records: ProductWithIdentifierRecord[],
  ): Promise<void> {
    if (records.length === 0) {
      return;
    }

    const db = this.drizzleService.getDb();

    await db.transaction(async (tx) => {
      const insertedProducts = await tx
        .insert(products)
        .values(records.map((record) => record.product))
        .returning({ id: products.id });

      const identifierRows = insertedProducts.map((insertedProduct, index) => ({
        ...records[index].identifier,
        product_id: insertedProduct.id,
      }));

      await tx.insert(product_identifiers).values(identifierRows);
    });
  }

  async getChains(): Promise<Chain[]> {
    const db = this.drizzleService.getDb();
    return db.select().from(chains);
  }

  async insertChain(record: NewChain): Promise<Chain> {
    const db = this.drizzleService.getDb();
    const [chain] = await db.insert(chains).values(record).returning();
    return chain;
  }

  async updateChain(
    id: number,
    updates: Partial<Pick<NewChain, "name">>,
  ): Promise<Chain | null> {
    if (Object.keys(updates).length === 0) {
      return null;
    }

    const db = this.drizzleService.getDb();
    const [chain] = await db
      .update(chains)
      .set(updates)
      .where(eq(chains.id, id))
      .returning();

    return chain ?? null;
  }

  async deleteChain(id: number): Promise<boolean> {
    const db = this.drizzleService.getDb();
    const deletedRows = await db.delete(chains).where(eq(chains.id, id)).returning({
      id: chains.id,
    });

    return deletedRows.length > 0;
  }
}
