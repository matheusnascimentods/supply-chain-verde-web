import { z } from 'zod';
import { CompanyType, UserRole, userRoleSchema } from '../../../core/auth/session/index.model';

export interface User {
  userId: number;
  name: string;
  email: string;
  role: UserRole;
  // Inativo não entra no sistema e não ocupa assento.
  active: boolean;
  createdAt?: string | null;
  companyId?: number | null;
  companyType?: CompanyType | null;
  companyName?: string | null;
}

export interface UserPage {
  items: User[];
  totalPages: number;
}

/** Assentos da assinatura: usuários ativos + convites pendentes, contra o teto da companhia. */
export interface Seats {
  used: number;
  max: number;
}

// O convidado entra na companhia de quem convida (RN-09); a API recusa perfis fora do tipo da companhia.
export const newInviteSchema = z.object({
  email: z.string().email(),
  role: userRoleSchema,
});

export type NewInvite = z.output<typeof newInviteSchema>;
