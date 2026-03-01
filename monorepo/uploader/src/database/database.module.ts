import { Module } from "@nestjs/common";
import { DrizzleService } from "./drizzle.service";
import { DrizzleDataRepository } from "./repositories/drizzle-data.repository";
import { DATA_REPOSITORY } from "./repositories/data.repository.interface";

@Module({
  providers: [
    DrizzleService,
    {
      provide: DATA_REPOSITORY,
      useClass: DrizzleDataRepository,
    },
  ],
  exports: [DrizzleService, DATA_REPOSITORY],
})
export class DatabaseModule {}
