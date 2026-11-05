import { UserRole } from '../../../core/auth/session/index.model';
import { SupplierRanking } from './index.model';

type Role = UserRole | null;

export function canGenerateReports(role: Role): boolean {
  return role === 'admin' || role === 'manager' || role === 'auditor';
}

export function canOpenReports(role: Role, ownSupplierId: number | null, supplierId: number): boolean {
  if (role === 'supplier') return ownSupplierId === supplierId;
  return canGenerateReports(role);
}

export type CertificationTone = 'expired' | 'active' | 'none';

export function certificationTone(supplier: SupplierRanking): CertificationTone {
  if (supplier.certifications.some((certification) => certification.status === 'EXPIRED')) return 'expired';
  return supplier.activeCertificationCount > 0 ? 'active' : 'none';
}
