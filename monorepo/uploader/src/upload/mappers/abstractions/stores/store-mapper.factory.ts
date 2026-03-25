import { BadRequestException, Injectable } from "@nestjs/common";
import { ShufersalStoreMapper } from "../../shufersal/stores/shufersal-stores.mapper";
import { RamiLevyStoreMapper } from "../../rami-levy/stores/rami-levy-stores.mapper";
import { IStoreMapper } from "./store-mapper.interface";

const STORE_PIPELINE_NAMES = {
	SHUFERSAL_STORES: "shufersal_stores",
	RAMI_LEVY_STORES: "rami_levy_stores",
} as const;

@Injectable()
export class StoreMapperFactory {
	constructor(
		private readonly shufersalStoreMapper: ShufersalStoreMapper,
		private readonly ramiLevyStoreMapper: RamiLevyStoreMapper,
	) {}

	getMapper(pipelineName: string): IStoreMapper {
		switch (pipelineName.toLowerCase()) {
			case STORE_PIPELINE_NAMES.SHUFERSAL_STORES:
					return this.shufersalStoreMapper;
			case STORE_PIPELINE_NAMES.RAMI_LEVY_STORES:
					return this.ramiLevyStoreMapper;
			default:
				throw new BadRequestException(
					`No store mapper found for pipeline: ${pipelineName}. Supported store pipelines: ${Object.values(STORE_PIPELINE_NAMES).join(", ")}`,
				);
		}
	}
}
