import { CompanyType, ROLES_BY_COMPANY_TYPE, UserRole } from '../../../core/auth/session/index.model';

type Role = UserRole | null;

// RN-09: só o admin cria usuários, e na própria companhia; o platform_admin não tem companhia e a API o recusa.
export function canCreateUsers(role: Role): boolean {
  return role === 'admin';
}

// O platform_admin troca perfis de qualquer companhia.
export function canChangeRoles(role: Role): boolean {
  return role === 'admin' || role === 'platform_admin';
}

// Perfis válidos para a companhia (RN-07); sem companhia (platform_admin), nenhum.
export function creatableRoles(companyType: CompanyType | null | undefined): readonly UserRole[] {
  return companyType ? ROLES_BY_COMPANY_TYPE[companyType] : [];
}
