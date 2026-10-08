import type { CertificationStatus } from '../../certifications';

export interface Address {
  street: string;
  number: string;
  neighborhood: string;
  complement: string;
  zipCode: string;
  city: string;
  state: string;
}

export type SupplierAddress = { addressId?: number | null } & { [K in keyof Address]?: string | null };

export interface Supplier {
  supplierId: number;
  name: string;
  cnpj?: string | null;
  address?: SupplierAddress | null;
  phone?: string | null;
  registeredAt?: string | null;
}

export interface SupplierCertification {
  certificationId: number;
  certification: string;
  issuingBody: string;
  issuedAt: string;
  expiresAt: string;
  status: CertificationStatus;
}

export interface SupplierRanking extends Supplier {
  sustainabilityScore: number;
  activeCertificationCount: number;
  totalCo2Kg: number;
  reportCount: number;
  certifications: SupplierCertification[];
}

export interface NewSupplier {
  name: string;
  cnpj: string;
  phone: string;
  address: Address;
}

export interface Page<T> {
  items: T[];
  totalPages: number;
}
