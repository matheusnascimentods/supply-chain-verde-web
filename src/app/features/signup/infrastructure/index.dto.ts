import { z } from 'zod';
import { loginResponseSchema } from '../../auth';

export const plansResponseSchema = z.array(
  z.object({
    code: z.string(),
    name: z.string(),
    maxUsers: z.number(),
  }),
);

// POST /companies responde igual ao login.
export const signUpResponseSchema = loginResponseSchema;
export type SignUpResponseDTO = z.infer<typeof signUpResponseSchema>;
