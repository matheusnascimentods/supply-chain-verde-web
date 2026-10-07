import { UserRole } from '../../../core/auth/session/index.model';

export function canManageUsers(role: UserRole | null): boolean {
  return role === 'admin';
}
