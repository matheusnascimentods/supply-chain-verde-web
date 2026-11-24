import { CompanyType, UserRole } from '../../../core/auth/session/index.model';
import type { Product } from '../../products';
import { Batch, BatchStatus } from './index.model';
import { nextStage, stageOwner } from './stage/index.model';

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

// RF-13: o mercado pede o lote; o fornecedor executa ou recusa.
export function canCreateBatch(role: Role, companyType: Company): boolean {
  return actsFor('market', role, companyType);
}

export function canCalculateEmission(role: Role): boolean {
  return role === 'admin' || role === 'manager' || role === 'supplier';
}

// Só o lado dono da próxima etapa a registra (RN-08 da API), e só em lote Pendente ou Em andamento.
export function canAddStageTo(role: Role, companyType: Company, batch: Batch): boolean {
  const next = nextStage(batch.currentStage);
  if (next === null || (batch.status !== 'PENDING' && batch.status !== 'ACTIVE')) return false;
  return actsFor(stageOwner(next), role, companyType);
}

// RF-15: o fornecedor recusa um lote pendente.
export function canReject(role: Role, companyType: Company, batch: Batch): boolean {
  return actsFor('supplier', role, companyType) && canMove(batch.status, 'REJECTED');
}

// O catálogo vem ordenado pela API; só o topo da primeira página é o melhor, e só se tiver histórico de CO₂.
export function isRecommended(product: Product, index: number, page: number): boolean {
  return page === 0 && index === 0 && product.co2KgPerUnit != null;
}
