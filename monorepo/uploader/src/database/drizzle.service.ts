import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

@Injectable()
export class DrizzleService implements OnModuleInit {
  private db: NodePgDatabase<typeof schema>;
  private pool: Pool;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const host = this.configService.get<string>("DB_HOST", "localhost");
    const port = this.configService.get<number>("DB_PORT", 5432);
    const user = this.configService.get<string>("DB_USER", "postgres");
    const password = this.configService.get<string>("DB_PASSWORD", "");
    const database = this.configService.get<string>("DB_NAME", "retail_store");

    this.pool = new Pool({
      host,
      port,
      user,
      password,
      database,
    });

    this.db = drizzle(this.pool, { schema });
  }

  getDb(): NodePgDatabase<typeof schema> {
    if (!this.db) {
      throw new Error(
        "Database not initialized. Make sure the module has been initialized.",
      );
    }
    return this.db;
  }

  async close() {
    await this.pool.end();
  }
}
