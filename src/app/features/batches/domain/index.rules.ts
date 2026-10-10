import { UserRole } from '../../../core/auth/session/index.model';
import type { SupplierRanking } from '../../suppliers';
import { Batch } from './index.model';

type Role = UserRole | null;

export function canCreateBatch(role: Role): boolean {
  return role === 'admin' || role === 'supplier';
}

export function canCalculateEmission(role: Role): boolean {
  return role === 'admin' || role === 'manager';
}

// A jornada termina no varejo: um lote nessa etapa não recebe novas etapas.
export function canAddStageTo(role: Role, batch: Batch): boolean {
  const allowed = role === 'admin' || role === 'manager' || role === 'supplier';
  return allowed && batch.currentStage !== 'RETAIL';
}

// O ranking recomendado vem ordenado pela API; só o topo da primeira página é o melhor, e só se tiver histórico.
export function isRecommended(supplier: SupplierRanking, index: number, page: number): boolean {
  return page === 0 && index === 0 && supplier.co2KgPerUnit != null;
}
