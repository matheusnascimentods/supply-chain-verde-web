import { UserRole } from '../../../core/auth/session/index.model';
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
