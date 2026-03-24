import { BadRequestException, Injectable } from "@nestjs/common";
import { and, eq, inArray, sql } from "drizzle-orm";
import { DrizzleService } from "../drizzle.service";
import {
  chains,
  Chain,
  data_sources,
  NewChain,
  NewProduct,
  price_events,
  product_identifiers,
  product_specs,
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

  async insertProductsWithPriceData(
    records: ProductWithIdentifierRecord[],
    sourceId: number,
  ): Promise<void> {
    if (records.length === 0) {
      return;
    }

    const db = this.drizzleService.getDb();

    await db.transaction(async (tx) => {
      // 1. Resolve chain internal IDs
      const chainExternalIds = [...new Set(records.map((r) => r.chainExternalId))];

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

      // 2. Resolve store internal IDs
      const storeExternalIds = [...new Set(records.map((r) => r.storeExternalId))];
      const chainIds = [...new Set(records.map((r) => chainIdByExternalId.get(r.chainExternalId)!))];

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

      // 3. Resolve store IDs for all records and check for missing stores
      const resolvedRecords = records.map((record) => {
        const chainId = chainIdByExternalId.get(record.chainExternalId)!;
        const storeLookupKey = `${chainId}:${record.storeExternalId}`;
        const storeId = storeIdByChainAndExternal.get(storeLookupKey);

        if (storeId === undefined) {
          throw new BadRequestException(
            `Store not found for ChainId=${record.chainExternalId} and StoreId=${record.storeExternalId}. Upload stores first.`,
          );
        }

        return { record, chainId, storeId };
      });

      // 4. Look up existing product_identifiers to avoid duplicates
      const externalCodes = [...new Set(records.map((r) => r.identifier.external_code))];

      const existingIdentifiers = await tx
        .select({
          product_id: product_identifiers.product_id,
          external_code: product_identifiers.external_code,
          chain_id: product_identifiers.chain_id,
          store_id: product_identifiers.store_id,
        })
        .from(product_identifiers)
        .where(
          and(
            inArray(product_identifiers.external_code, externalCodes),
            inArray(product_identifiers.chain_id, chainIds),
          ),
        );

      const existingIdentifierMap = new Map(
        existingIdentifiers
          .filter((id) => id.chain_id !== null && id.store_id !== null)
          .map((id) => [`${id.external_code}:${id.chain_id}:${id.store_id}`, id.product_id]),
      );

      // 5. Split records into new (need product+identifier insert) and existing (reuse product_id)
      const newRecords: typeof resolvedRecords = [];
      const existingRecords: { productId: number; record: ProductWithIdentifierRecord; chainId: number; storeId: number }[] = [];

      for (const resolved of resolvedRecords) {
        const lookupKey = `${resolved.record.identifier.external_code}:${resolved.chainId}:${resolved.storeId}`;
        const existingProductId = existingIdentifierMap.get(lookupKey);

        if (existingProductId !== undefined) {
          existingRecords.push({ productId: existingProductId, ...resolved });
        } else {
          newRecords.push(resolved);
        }
      }

      // 6. Insert new products + identifiers
      const allResolvedRows: { productId: number; record: ProductWithIdentifierRecord; chainId: number; storeId: number }[] =
        [...existingRecords];

      if (newRecords.length > 0) {
        const insertedProducts = await tx
          .insert(products)
          .values(newRecords.map((r) => r.record.product))
          .returning({ id: products.id });

        await tx.insert(product_identifiers).values(
          insertedProducts.map((insertedProduct, index) => ({
            ...newRecords[index].record.identifier,
            product_id: insertedProduct.id,
            chain_id: newRecords[index].chainId,
            store_id: newRecords[index].storeId,
          } as typeof product_identifiers.$inferInsert)),
        );

        for (let i = 0; i < insertedProducts.length; i++) {
          allResolvedRows.push({
            productId: insertedProducts[i].id,
            ...newRecords[i],
          });
        }
      }

      // 7. Insert price_events (for both new and existing products)
      const priceEventRows = allResolvedRows
        .filter((row) => row.record.priceEvent)
        .map((row) => ({
          product_id: row.productId,
          store_id: row.storeId,
          source_id: sourceId,
          price: row.record.priceEvent!.price,
          unit_price: row.record.priceEvent!.unit_price,
          published_at: row.record.priceEvent!.published_at,
        } as typeof price_events.$inferInsert));

      if (priceEventRows.length > 0) {
        await tx.insert(price_events).values(priceEventRows);
      }

      // 8. Upsert product_specs (ON CONFLICT DO UPDATE)
      const productSpecRows = allResolvedRows
        .filter((row) => row.record.productSpec)
        .map((row) => ({
          product_id: row.productId,
          is_weighted: row.record.productSpec!.is_weighted,
          base_quantity: row.record.productSpec!.base_quantity,
          base_unit: row.record.productSpec!.base_unit,
          attributes: row.record.productSpec!.attributes,
        } as typeof product_specs.$inferInsert));

      if (productSpecRows.length > 0) {
        await tx
          .insert(product_specs)
          .values(productSpecRows)
          .onConflictDoUpdate({
            target: product_specs.product_id,
            set: {
              is_weighted: sql`excluded.is_weighted`,
              base_quantity: sql`excluded.base_quantity`,
              base_unit: sql`excluded.base_unit`,
              attributes: sql`excluded.attributes`,
              updated_at: sql`NOW()`,
            } as Record<string, unknown>,
          });
      }
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
