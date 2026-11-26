export { routes } from './index.routes';
export { carbonEmissionResponseSchema, emissionFactorSchema, stageResponseSchema } from './infrastructure/stage/index.dto';
export {
  CALCULATION_METHODS,
  CALCULATION_METHOD_LABELS,
  ENERGY_SOURCES,
  ENERGY_SOURCE_LABELS,
  ENERGY_SOURCE_UNITS,
  STAGE_TYPES,
  STAGE_TYPE_LABELS,
  TRANSPORT_MODE_LABELS,
  isTransportStage,
} from './domain/stage/index.model';
// ponytail: reexportados para dashboard e suppliers seguirem iguais; eles podem importar de '../products' direto.
export { PRODUCT_UNITS, PRODUCT_UNIT_SYMBOLS } from '../products';
export { StageBadgeComponent } from './presentation/components/stage-badge/index.component';
export type {
  CalculationMethod,
  CarbonEmission,
  EmissionFactor,
  EnergySource,
  NewEmission,
  Stage,
  StageAddress,
  StageType,
} from './domain/stage/index.model';
export type { ProductUnit } from '../products';
