export interface Plan {
  code: string;
  name: string;
  maxUsers: number;
}

export const COMPANY_TYPE_LABELS = { MARKET: 'Varejista', SUPPLIER: 'Fornecedor' } as const;
export type SignupCompanyType = keyof typeof COMPANY_TYPE_LABELS;

export interface CompanySignup {
  planCode: string;
  type: SignupCompanyType;
  company: {
    name: string;
    cnpj: string;
    email: string;
    phone: string;
    address: {
      street: string;
      number: string;
      neighborhood: string;
      complement: string | null;
      zipCode: string;
      city: string;
      state: string;
    };
  };
  admin: { name: string; email: string; password: string };
}

export const MIN_PASSWORD_LENGTH = 8;

// A API só exige senha não vazia; o mínimo e a confirmação são regras do cadastro.
export function passwordErrors({ password, confirmPassword }: { password: string; confirmPassword: string }): Record<string, true> | null {
  if (password.length < MIN_PASSWORD_LENGTH) return { passwordTooShort: true };
  if (password !== confirmPassword) return { passwordMismatch: true };
  return null;
}
