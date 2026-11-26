import { CompanyType, UserRole } from '../../../core/auth/session/index.model';
import type { Product } from '../../products';
import { Batch, BatchStatus } from './index.model';
import type { ProductUnit } from '../../products';
import {
  CALCULATION_METHODS,
  CalculationMethod,
  EmissionFactor,
  EnergySource,
  FUEL_TYPES,
  FuelType,
  Stage,
  TransportMode,
  nextStage,
  stageOwner,
} from './stage/index.model';

type Role = UserRole | null;

type Company = CompanyType | null;

// Espelho do BatchStatus.canTransitionTo da API (017). Os estados ausentes são finais.
const TRANSITIONS: Partial<Record<BatchStatus, readonly BatchStatus[]>> = {
  PENDING: ['ACTIVE', 'REJECTED', 'CANCELED'],
  ACTIVE: ['COMPLETED'],
};
const canMove = (from: BatchStatus, to: BatchStatus) => TRANSITIONS[from]?.includes(to) ?? false;

const MARKET_ROLES: readonly Role[] = ['admin', 'manager'];
const SUPPLIER_ROLES: readonly Role[] = ['admin', 'supplier'];
const actsFor = (side: CompanyType, role: Role, companyType: Company) =>
  companyType === side && (side === 'market' ? MARKET_ROLES : SUPPLIER_ROLES).includes(role);

/** KG e TON derivam o peso da quantidade; nas demais unidades, o usuário informa. */
export function derivedCargoWeightKg(unit: ProductUnit | undefined, quantity: number): number | null {
  if (unit === 'KG') return quantity;
  if (unit === 'TON') return quantity * 1000;
  return null;
}

/** Metodologias com fator para a atividade escolhida. */
export function methodsFor(
  factors: EmissionFactor[],
  activity: { transportMode: TransportMode; fuelType: FuelType } | { energySource: EnergySource },
): CalculationMethod[] {
  const matches = (factor: EmissionFactor) =>
    'energySource' in activity
      ? factor.energySource === activity.energySource
      : factor.transportMode === activity.transportMode && factor.fuelType === activity.fuelType;
  return CALCULATION_METHODS.filter((method) => factors.some((factor) => factor.calculationMethod === method && matches(factor)));
}

/** Combustíveis com fator em alguma metodologia para o modo. */
export function fuelsFor(factors: EmissionFactor[], mode: TransportMode): FuelType[] {
  return FUEL_TYPES.filter((fuel) =>
    factors.some((factor) => factor.transportMode === mode && factor.fuelType === fuel),
  );
}

// RF-13: o mercado pede o lote; o fornecedor executa ou recusa.
export function canCreateBatch(role: Role, companyType: Company): boolean {
  return actsFor('market', role, companyType);
}

export function canCalculateEmission(role: Role): boolean {
  return role === 'admin' || role === 'manager' || role === 'supplier';
}

/** RN-11 da API: a última etapa sem emissão bloqueia a próxima. */
export function pendingEmissionStage(batch: Batch): Stage | null {
  const last = batch.stages.at(-1);
  return last && !last.emission ? last : null;
}

// RF-06: o lado dono da etapa pendente calcula a emissão dela, inclusive em lote Concluído (RN-13 da API).
export function canCalculatePendingEmission(role: Role, companyType: Company, batch: Batch): boolean {
  const stage = pendingEmissionStage(batch);
  return stage !== null && canCalculateEmission(role) && actsFor(stageOwner(stage.stageType), role, companyType);
}

// Só o lado dono da próxima etapa a registra (RN-08 da API), só em lote Pendente ou Em andamento e sem emissão pendente (RF-07).
export function canAddStageTo(role: Role, companyType: Company, batch: Batch): boolean {
  const next = nextStage(batch.currentStage);
  if (next === null || (batch.status !== 'PENDING' && batch.status !== 'ACTIVE') || pendingEmissionStage(batch)) return false;
  return actsFor(stageOwner(next), role, companyType);
}

// RF-15: o fornecedor recusa um lote pendente.
export function canReject(role: Role, companyType: Company, batch: Batch): boolean {
  return actsFor('supplier', role, companyType) && canMove(batch.status, 'REJECTED');
}

// O mercado cancela o próprio pedido enquanto o fornecedor não o aceitou.
export function canCancel(role: Role, companyType: Company, batch: Batch): boolean {
  return actsFor('market', role, companyType) && canMove(batch.status, 'CANCELED');
}

// O catálogo vem ordenado pela API; só o topo da primeira página é o melhor, e só se tiver histórico de CO₂.
export function isRecommended(product: Product, index: number, page: number): boolean {
  return page === 0 && index === 0 && product.co2KgPerUnit != null;
}
