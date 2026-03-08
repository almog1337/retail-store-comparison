import { BadRequestException, Injectable } from "@nestjs/common";
import { eq, inArray } from "drizzle-orm";
import { DrizzleService } from "../drizzle.service";
import {
  chains,
  Chain,
  NewChain,
  NewProduct,
  product_identifiers,
  products,
  stores,
} from "../schema";
import {
  IDataRepository,
  ProductWithIdentifierRecord,
  StoreUpsertRecord,
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

  async insertStores(records: StoreUpsertRecord[]): Promise<void> {
    if (records.length === 0) {
      return;
    }

    const db = this.drizzleService.getDb();
    const chainExternalIds = [...new Set(records.map((record) => record.chainExternalId))];

    const existingChains = await db
      .select({ id: chains.id, external_id: chains.external_id })
      .from(chains)
      .where(inArray(chains.external_id, chainExternalIds));

    const chainIdByExternalId = new Map(
      existingChains.map((chain) => [chain.external_id, chain.id]),
    );

    const missingChainExternalId = chainExternalIds.find(
      (externalId) => !chainIdByExternalId.has(externalId),
    );

    if (missingChainExternalId) {
      throw new BadRequestException(
        `Chain not found for ChainId=${missingChainExternalId}. Insert the chain before uploading stores.`,
      );
    }

    await db.insert(stores).values(
      records.map((record) => ({
        ...record.store,
        chain_id: chainIdByExternalId.get(record.chainExternalId)!,
      })),
    );
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
    updates: Partial<Pick<NewChain, "external_id" | "name">>,
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
