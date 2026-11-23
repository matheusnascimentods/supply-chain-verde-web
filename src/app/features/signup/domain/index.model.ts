export const COMPANY_TYPE_LABELS = { MARKET: 'Varejista', SUPPLIER: 'Fornecedor' } as const;
export type SignupCompanyType = keyof typeof COMPANY_TYPE_LABELS;

export interface CompanySignup {
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
