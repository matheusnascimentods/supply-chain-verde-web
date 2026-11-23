import { CompanyType, UserRole } from '../../../core/auth/session/index.model';
import type { Product } from '../../products';
import { Batch } from './index.model';
import { nextStage } from './stage/index.model';

type Role = UserRole | null;

type Company = CompanyType | null;

// RF-13: o mercado pede o lote; o fornecedor executa ou recusa.
export function canCreateBatch(role: Role, companyType: Company): boolean {
  return companyType === 'market' && (role === 'admin' || role === 'manager');
}

export function canCalculateEmission(role: Role): boolean {
  return role === 'admin' || role === 'manager';
}

// A jornada termina no varejo; lote recusado não recebe etapa, e o pendente só pelo fornecedor (RF-15).
export function canAddStageTo(role: Role, companyType: Company, batch: Batch): boolean {
  const allowed = role === 'admin' || role === 'manager' || role === 'supplier';
  if (!allowed || batch.status === 'REJECTED' || nextStage(batch.currentStage) === null) return false;
  return batch.status !== 'PENDING' || companyType === 'supplier';
}

// RF-15: o fornecedor recusa um lote pendente (RN-19 da API); recusado é final.
export function canReject(role: Role, companyType: Company, batch: Batch): boolean {
  return companyType === 'supplier' && (role === 'admin' || role === 'supplier') && batch.status === 'PENDING';
}

// O catálogo vem ordenado pela API; só o topo da primeira página é o melhor, e só se tiver histórico de CO₂.
export function isRecommended(product: Product, index: number, page: number): boolean {
  return page === 0 && index === 0 && product.co2KgPerUnit != null;
}
