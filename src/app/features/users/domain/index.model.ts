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

// O convidado entra na companhia de quem convida (RN-09); a API recusa perfis fora do tipo da companhia.
export const newInviteSchema = z.object({
  email: z.string().email(),
  role: userRoleSchema,
});

export type NewInvite = z.output<typeof newInviteSchema>;
