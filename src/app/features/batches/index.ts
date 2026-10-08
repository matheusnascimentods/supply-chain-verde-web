export { routes } from './index.routes';
export { carbonEmissionResponseSchema, stageResponseSchema } from './infrastructure/stage/index.dto';
export { STAGE_TYPES, STAGE_TYPE_LABELS, TRANSPORT_MODE_LABELS } from './domain/stage/index.model';
export { PRODUCT_UNITS, PRODUCT_UNIT_SYMBOLS } from './domain/product/index.model';
export { StageBadgeComponent } from './presentation/components/stage-badge/index.component';
export type { CarbonEmission, Stage, StageAddress, StageType } from './domain/stage/index.model';
export type { ProductUnit } from './domain/product/index.model';
