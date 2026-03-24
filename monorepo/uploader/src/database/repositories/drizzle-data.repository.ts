import { BadRequestException, Injectable } from "@nestjs/common";
import { and, eq, inArray } from "drizzle-orm";
import { DrizzleService } from "../drizzle.service";
import {
  chains,
  Chain,
  data_sources,
  NewChain,
  NewProduct,
  product_identifiers,
  products,
  stores,
} from "../schema";
import {
  DataSourceInsert,
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
      const chainExternalIds = [...new Set(records.map((record) => record.chainExternalId))];

      const existingChains = await tx
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
          `Chain not found for ChainId=${missingChainExternalId}. Insert stores for this chain before uploading prices.`,
        );
      }

      const storeExternalIds = [...new Set(records.map((record) => record.storeExternalId))];
      const chainIds = [...new Set(records.map((record) => chainIdByExternalId.get(record.chainExternalId)!))];

      const matchingStores = await tx
        .select({
          id: stores.id,
          chain_id: stores.chain_id,
          store_external_id: stores.store_external_id,
        })
        .from(stores)
        .where(
          and(
            inArray(stores.chain_id, chainIds),
            inArray(stores.store_external_id, storeExternalIds),
          ),
        );

      const storeIdByChainAndExternal = new Map(
        matchingStores
          .filter((store) => store.store_external_id !== null)
          .map((store) => [`${store.chain_id}:${store.store_external_id}`, store.id]),
      );

      const insertedProducts = await tx
        .insert(products)
        .values(records.map((record) => record.product))
        .returning({ id: products.id });

      const identifierRows = insertedProducts.map((insertedProduct, index) => {
        const chainId = chainIdByExternalId.get(records[index].chainExternalId)!;
        const storeLookupKey = `${chainId}:${records[index].storeExternalId}`;
        const storeId = storeIdByChainAndExternal.get(storeLookupKey);

        if (storeId === undefined) {
          throw new BadRequestException(
            `Store not found for ChainId=${records[index].chainExternalId} and StoreId=${records[index].storeExternalId}. Upload stores first.`,
          );
        }

        return {
          ...records[index].identifier,
          product_id: insertedProduct.id,
          chain_id: chainId,
          store_id: storeId,
        };
      });

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
        source_id: record.sourceId,
      } as typeof stores.$inferInsert)),
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

  async insertDataSource(record: DataSourceInsert): Promise<{ id: number }> {
    const db = this.drizzleService.getDb();

    const [existingChain] = await db
      .select({ id: chains.id })
      .from(chains)
      .where(eq(chains.external_id, record.chainExternalId));

    if (!existingChain) {
      throw new BadRequestException(
        `Chain not found for ChainId=${record.chainExternalId}. Insert the chain before tracking data sources.`,
      );
    }

    const [inserted] = await db
      .insert(data_sources)
      .values({
        chain_id: existingChain.id,
        file_name: record.fileName,
        source_url: record.sourceUrl,
        file_type: record.fileType,
        published_at: record.publishedAt,
        scraped_at: record.scrapedAt,
      } as typeof data_sources.$inferInsert)
      .returning({ id: data_sources.id });

    return { id: inserted.id };
  }
}
