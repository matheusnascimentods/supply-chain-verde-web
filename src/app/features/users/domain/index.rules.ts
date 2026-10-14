import { USER_ROLES, UserRole } from '../../../core/auth/session/index.model';

type Role = UserRole | null;

export function canManageUsers(role: Role): boolean {
  return role === 'admin' || role === 'manager';
}

export function canChangeRoles(role: Role): boolean {
  return role === 'admin';
}

// O gestor só dá acesso a fornecedores.
export function creatableRoles(role: Role): readonly UserRole[] {
  if (role === 'admin') return USER_ROLES;
  return role === 'manager' ? ['supplier'] : [];
}
