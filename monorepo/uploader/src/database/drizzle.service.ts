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
    const host = this.configService.get<string>("database.host", "localhost");
    const port = this.configService.get<number>("database.port", 5432);
    const user = this.configService.get<string>("database.user", "postgres");
    const password = this.configService.get<string>("database.password", "postgres");
    const database = this.configService.get<string>("database.name", "retail_store");

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
