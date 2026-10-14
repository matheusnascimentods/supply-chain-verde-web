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
  co2KgPerUnit?: number | null;
}

/** Critério da recomendação: produto cadastrado ou categoria + unidade de um produto novo. */
export type RecommendationCriteria = { productId: number } | { category: string; unit: string };

/** Acesso (usuário `SUPPLIER`) criado junto com o fornecedor. */
export interface SupplierAccess {
  name: string;
  email: string;
  password: string;
}

export interface NewSupplier {
  name: string;
  cnpj: string;
  phone: string;
  address: Address;
  user?: SupplierAccess;
}

/** Campos que o próprio fornecedor edita em `/suppliers/me`. */
export interface OwnSupplierProfile {
  name: string;
  phone: string;
  address: Address;
  userName: string;
}

export interface PasswordChange {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/** Corpo do `PATCH /suppliers/me`: só os campos alterados. */
export type OwnSupplierPatch = Partial<Omit<OwnSupplierProfile, 'address'>> & {
  address?: Address;
  currentPassword?: string;
  newPassword?: string;
};

export interface Page<T> {
  items: T[];
  totalPages: number;
}
