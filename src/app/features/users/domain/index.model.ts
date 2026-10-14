import { z } from 'zod';
import { UserRole, userRoleSchema } from '../../../core/auth/session/index.model';

export interface User {
  userId: number;
  name: string;
  email: string;
  role: UserRole;
  createdAt?: string | null;
  supplierId?: number | null;
  supplierName?: string | null;
}

export interface UserPage {
  items: User[];
  totalPages: number;
}

// Usuário SUPPLIER sempre nasce vinculado a um fornecedor sem acesso; os demais roles não levam supplierId.
export const newUserSchema = z
  .object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(1),
    role: userRoleSchema,
    supplierId: z.number().int().positive().nullish(),
  })
  .refine((user) => user.role !== 'supplier' || !!user.supplierId, { path: ['supplierId'] })
  .transform(({ supplierId, ...user }) => (user.role === 'supplier' ? { ...user, supplierId: supplierId! } : user));

export type NewUser = z.output<typeof newUserSchema>;
