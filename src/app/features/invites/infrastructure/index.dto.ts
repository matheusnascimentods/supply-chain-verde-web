import { z } from 'zod';
import { userRoleSchema } from '../../../core/auth/session/index.model';
import { loginResponseSchema } from '../../auth';

export const inviteDetailsSchema = z.object({
  email: z.string().email(),
  role: z.preprocess((value) => (typeof value === 'string' ? value.toLowerCase() : value), userRoleSchema),
  companyName: z.string(),
  expiresAt: z.string(),
});

// POST /invites/accept responde igual ao login.
export const acceptResponseSchema = loginResponseSchema;
export type AcceptResponseDTO = z.infer<typeof acceptResponseSchema>;
