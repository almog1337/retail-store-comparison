/**
 * Allowed pipeline names for data upload.
 * Only these pipeline names are accepted by the uploader service.
 *
 * To add a new pipeline:
 * 1. Add the pipeline name to this array
 * 2. Ensure the scraper implementation exists in the scraper project
 */
export const ALLOWED_PIPELINE_NAMES = [
  "shufersal",
  "shufersal_stores",
] as const;

export type PipelineName = (typeof ALLOWED_PIPELINE_NAMES)[number];
