import { z } from 'zod';

export const USER_ROLES = ['admin', 'manager', 'auditor', 'supplier', 'platform_admin'] as const;

export const userRoleSchema = z.enum(USER_ROLES);

export type UserRole = z.infer<typeof userRoleSchema>;

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  manager: 'Gestor',
  auditor: 'Auditor',
  supplier: 'Fornecedor',
  platform_admin: 'Admin da plataforma',
};

export const COMPANY_TYPES = ['market', 'supplier'] as const;

export type CompanyType = (typeof COMPANY_TYPES)[number];

// Perfis que cada tipo de companhia pode ter (RN-07 da API); o platform_admin não pertence a nenhuma.
export const ROLES_BY_COMPANY_TYPE: Record<CompanyType, readonly UserRole[]> = {
  market: ['admin', 'manager', 'auditor'],
  supplier: ['admin', 'supplier'],
};

export function parseCompanyType(value: unknown): CompanyType | null {
  const normalized = typeof value === 'string' ? value.toLowerCase() : null;
  return COMPANY_TYPES.find((type) => type === normalized) ?? null;
}

export function parseUserRole(value: unknown): UserRole | null {
  if (typeof value === 'string') {
    const normalized = value.toLowerCase();
    const result = userRoleSchema.safeParse(normalized);
    if (result.success) {
      return result.data;
    }
  }
  return null;
}
