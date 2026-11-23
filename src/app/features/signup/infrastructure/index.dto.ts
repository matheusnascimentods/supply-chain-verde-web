import { z } from 'zod';
import { loginResponseSchema } from '../../auth';

// POST /companies responde igual ao login.
export const signUpResponseSchema = loginResponseSchema;
export type SignUpResponseDTO = z.infer<typeof signUpResponseSchema>;
