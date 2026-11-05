import type { CompanyType } from '../../../core/auth/session/index.model';

/** Corpo do `PATCH /users/me`: só os campos alterados. */
export interface AccountPatch {
  userName?: string;
  currentPassword?: string;
  newPassword?: string;
}

export interface PasswordChange {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface CompanyAddress {
  street: string;
  number: string;
  neighborhood: string;
  complement: string;
  zipCode: string;
  city: string;
  state: string;
}

export interface CompanyPlan {
  code: string;
  name: string;
  maxUsers: number;
}

/** `GET /companies/me`: dados da companhia do usuário e o plano ativo. */
export interface OwnCompany {
  companyId: number;
  name: string;
  cnpj: string;
  email: string | null;
  phone: string | null;
  type: CompanyType;
  address: Partial<Record<keyof CompanyAddress, string | null>> | null;
  plan: CompanyPlan | null;
}

/** Campos editáveis da companhia, como no formulário; CNPJ e tipo não mudam (RN-05). */
export interface CompanyForm {
  name: string;
  email: string;
  phone: string;
  address: CompanyAddress;
}

/** Corpo do `PATCH /companies/me`: só os campos alterados; o endereço vai inteiro. */
export type CompanyPatch = Partial<CompanyForm>;
