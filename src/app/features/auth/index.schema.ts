import { z } from 'zod';
import { userRoleSchema, UserRole } from '../../core/session/index.schema';

export const loginRequestSchema = z.object({
  email: z.string().trim().email('Formato de e-mail inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export const loginResponseSchema = z.object({
  token: z.string().min(1, 'Token não pode ser vazio'),
  expiresAt: z.string(),
  role: z.preprocess((val) => (typeof val === 'string' ? val.toLowerCase() : val), userRoleSchema),
});

export type LoginRequestDTO = z.infer<typeof loginRequestSchema>;
export type LoginResponseDTO = z.infer<typeof loginResponseSchema>;
