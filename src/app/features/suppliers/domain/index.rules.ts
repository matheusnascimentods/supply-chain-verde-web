import { UserRole } from '../../../core/auth/session/index.model';
import { digitsOnly } from '../../../shared/utils/format/index.utils';
import { NewSupplier, SupplierRanking } from './index.model';

type Role = UserRole | null;

export function canManageSuppliers(role: Role): boolean {
  return role === 'admin' || role === 'manager';
}

export function canGenerateReports(role: Role): boolean {
  return role === 'admin' || role === 'manager' || role === 'auditor';
}

export function canOpenReports(role: Role, userId: number | null, supplierId: number): boolean {
  if (role === 'supplier') return userId === supplierId;
  return canGenerateReports(role);
}

export function canUpdateCertificationStatus(role: Role): boolean {
  return role === 'admin' || role === 'auditor';
}

export function canCreateCertification(role: Role, userId: number | null, supplierId: number): boolean {
  return role === 'admin' || (role === 'supplier' && userId === supplierId);
}

export type CertificationTone = 'expired' | 'active' | 'none';

export function certificationTone(supplier: SupplierRanking): CertificationTone {
  if (supplier.certifications.some((certification) => certification.status === 'EXPIRED')) return 'expired';
  return supplier.activeCertificationCount > 0 ? 'active' : 'none';
}

// A API recebe CNPJ e telefone apenas com dígitos.
export function normalizeNewSupplier(supplier: NewSupplier): NewSupplier {
  return { ...supplier, cnpj: digitsOnly(supplier.cnpj), phone: digitsOnly(supplier.phone) };
}
