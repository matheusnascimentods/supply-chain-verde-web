import { z } from 'zod';
import { CompanyType, UserRole, userRoleSchema } from '../../../core/auth/session/index.model';

export interface User {
  userId: number;
  name: string;
  email: string;
  role: UserRole;
  createdAt?: string | null;
  companyId?: number | null;
  companyType?: CompanyType | null;
  companyName?: string | null;
}

export interface UserPage {
  items: User[];
  totalPages: number;
}

// O usuário nasce na companhia de quem cria (RN-09); a API recusa perfis fora do tipo da companhia.
export const newUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(1),
  role: userRoleSchema,
});

export type NewUser = z.output<typeof newUserSchema>;
