import { z } from 'zod';

export const USER_ROLES = ['admin', 'manager', 'auditor', 'supplier'] as const;

export const userRoleSchema = z.enum(USER_ROLES);

export type UserRole = z.infer<typeof userRoleSchema>;

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
