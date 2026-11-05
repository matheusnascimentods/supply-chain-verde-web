import { USER_ROLES, UserRole } from '../../../core/auth/session/index.model';

type Role = UserRole | null;

// ponytail: perfis atribuíveis sem olhar o tipo da companhia; a Task 5 troca por ROLES_BY_COMPANY_TYPE.
export const ASSIGNABLE_ROLES = USER_ROLES.filter((role) => role !== 'platform_admin');

export function canManageUsers(role: Role): boolean {
  return role === 'admin' || role === 'manager';
}

export function canChangeRoles(role: Role): boolean {
  return role === 'admin';
}

// O gestor só dá acesso a fornecedores.
export function creatableRoles(role: Role): readonly UserRole[] {
  if (role === 'admin') return ASSIGNABLE_ROLES;
  return role === 'manager' ? ['supplier'] : [];
}
