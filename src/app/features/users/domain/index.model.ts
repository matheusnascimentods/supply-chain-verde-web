import { z } from 'zod';
import { UserRole, userRoleSchema } from '../../../core/auth/session/index.model';

export interface User {
  userId: number;
  name: string;
  email: string;
  role: UserRole;
  createdAt?: string | null;
}

export interface UserPage {
  items: User[];
  totalPages: number;
}

export const newUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(1),
  role: userRoleSchema,
});

export type NewUser = z.infer<typeof newUserSchema>;
