import { z } from 'zod';
import { userRoleSchema } from '../../../core/auth/session/index.model';

export const loginResponseSchema = z.object({
  token: z.string().min(1, 'Token não pode ser vazio'),
  expiresAt: z.string(),
  role: z.preprocess((val) => (typeof val === 'string' ? val.toLowerCase() : val), userRoleSchema),
});

export type LoginResponseDTO = z.infer<typeof loginResponseSchema>;
