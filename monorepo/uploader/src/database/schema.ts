import { sql } from "drizzle-orm";
import {
  AnyPgColumn,
  bigint,
  boolean,
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

export const chains = pgTable(
  "chains",
  {
    id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
    external_id: text("external_id").notNull(),
    name: text("name").notNull().unique(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    chains_external_id_unique: unique("chains_external_id_unique").on(table.external_id),
  }),
);

export const data_sources = pgTable(
  "data_sources",
  {
    id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
    chain_id: integer("chain_id").references(() => chains.id, { onDelete: "cascade" }),
    file_name: text("file_name").notNull(),
    file_checksum: text("file_checksum"),
    source_url: text("source_url"),
    file_type: text("file_type"),
    total_items: integer("total_items"),
    status: text("status").default("pending"),
    published_at: timestamp("published_at", { withTimezone: true }),
    scraped_at: timestamp("scraped_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    file_checksum_unique: unique("data_sources_file_checksum_unique").on(table.file_checksum),
    idx_data_sources_checksum: index("idx_data_sources_checksum").on(table.file_checksum),
  }),
);

export const stores = pgTable(
  "stores",
  {
    id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
    chain_id: integer("chain_id")
      .notNull()
      .references(() => chains.id, { onDelete: "cascade" }),
    store_external_id: text("store_external_id"),
    name: text("name"),
    city: text("city"),
    address: text("address"),
    latitude: numeric("latitude", { precision: 10, scale: 8 }),
    longitude: numeric("longitude", { precision: 11, scale: 8 }),
    store_type: text("store_type"),
    is_active: boolean("is_active").default(true),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    idx_stores_location: index("idx_stores_location").on(table.latitude, table.longitude),
  }),
);

export const categories = pgTable(
  "categories",
  {
    id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
    parent_id: integer("parent_id").references((): AnyPgColumn => categories.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
  },
  (table) => ({
    categories_parent_name_unique: unique("categories_parent_name_unique").on(
      table.parent_id,
      table.name,
    ),
    idx_categories_parent: index("idx_categories_parent").on(table.parent_id),
  }),
);

export const brands = pgTable(
  "brands",
  {
    id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
    name: text("name").notNull().unique(),
    parent_brand_id: integer("parent_brand_id").references((): AnyPgColumn => brands.id, {
      onDelete: "set null",
    }),
    is_conglomerate: boolean("is_conglomerate").default(false),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    idx_brands_parent: index("idx_brands_parent").on(table.parent_brand_id),
  }),
);

export const products = pgTable("products", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  canonical_name: text("canonical_name").notNull(),
  brand_id: integer("brand_id").references(() => brands.id, { onDelete: "set null" }),
  category_id: integer("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const tags = pgTable("tags", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  name: text("name").notNull().unique(),
  tag_group: text("tag_group"),
});

export const product_tags = pgTable(
  "product_tags",
  {
    product_id: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    tag_id: integer("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => ({
    product_tags_pk: primaryKey({ columns: [table.product_id, table.tag_id] }),
  }),
);

export const product_identifiers = pgTable(
  "product_identifiers",
  {
    id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
    product_id: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    chain_id: integer("chain_id").references(() => chains.id, { onDelete: "cascade" }),
    store_id: integer("store_id").references(() => stores.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    external_code: text("external_code").notNull(),
    code_type: text("code_type"),
  },
  (table) => ({
    product_identifiers_external_code_chain_id_store_id_unique: unique(
      "product_identifiers_external_code_chain_id_store_id_unique",
    ).on(table.external_code, table.chain_id, table.store_id),
    product_identifiers_code_type_check: check(
      "product_identifiers_code_type_check",
      sql`${table.code_type} IN ('EAN', 'PLU', 'INTERNAL')`,
    ),
    idx_product_identifiers_code: index("idx_product_identifiers_code").on(table.external_code),
  }),
);

export const product_specs = pgTable("product_specs", {
  product_id: integer("product_id")
    .primaryKey()
    .references(() => products.id, { onDelete: "cascade" }),
  is_weighted: boolean("is_weighted").default(false),
  base_quantity: numeric("base_quantity", { precision: 10, scale: 3 }),
  base_unit: text("base_unit"),
  attributes: jsonb("attributes").default(sql`'{}'::jsonb`),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const product_components = pgTable(
  "product_components",
  {
    parent_product_id: integer("parent_product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    child_product_id: integer("child_product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull().default(1),
  },
  (table) => ({
    product_components_pk: primaryKey({
      columns: [table.parent_product_id, table.child_product_id],
    }),
  }),
);

export const price_events = pgTable(
  "price_events",
  {
    id: bigint("id", { mode: "number" }).generatedByDefaultAsIdentity().primaryKey(),
    product_id: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    store_id: integer("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    source_id: integer("source_id")
      .notNull()
      .references(() => data_sources.id, { onDelete: "cascade" }),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    unit_price: numeric("unit_price", { precision: 10, scale: 2 }),
    scraped_at: timestamp("scraped_at", { withTimezone: true }).defaultNow(),
    published_at: timestamp("published_at", { withTimezone: true }),
    raw_xml_item_data: jsonb("raw_xml_item_data"),
  },
  (table) => ({
    idx_price_events_product_id: index("idx_price_events_product_id").on(table.product_id),
    idx_price_events_scraped_at: index("idx_price_events_scraped_at").on(table.scraped_at),
    idx_price_events_source_id: index("idx_price_events_source_id").on(table.source_id),
  }),
);

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type ProductIdentifier = typeof product_identifiers.$inferSelect;
export type NewProductIdentifier = typeof product_identifiers.$inferInsert;
export type Chain = typeof chains.$inferSelect;
export type NewChain = typeof chains.$inferInsert;
export type NewStore = typeof stores.$inferInsert;
