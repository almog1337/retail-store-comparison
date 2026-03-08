import { BadRequestException, Injectable } from "@nestjs/common";
import { ShufersalStoreMapper } from "../../shufersal/stores/shufersal-stores.mapper";
import { IStoreMapper } from "./store-mapper.interface";

const STORE_PIPELINE_NAMES = {
	SHUFERSAL_STORES: "shufersal_stores",
} as const;

@Injectable()
export class StoreMapperFactory {
	constructor(private readonly shufersalStoreMapper: ShufersalStoreMapper) {}

	getMapper(pipelineName: string): IStoreMapper {
		switch (pipelineName.toLowerCase()) {
			case STORE_PIPELINE_NAMES.SHUFERSAL_STORES:
					return this.shufersalStoreMapper;
			default:
				throw new BadRequestException(
					`No store mapper found for pipeline: ${pipelineName}. Supported store pipelines: ${Object.values(STORE_PIPELINE_NAMES).join(", ")}`,
				);
		}
	}
}
