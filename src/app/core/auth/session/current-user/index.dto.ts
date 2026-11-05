import { z } from 'zod';
import { COMPANY_TYPES, userRoleSchema } from '../index.model';

export const currentUserResponseSchema = z.object({
  userId: z.number(),
  name: z.string(),
  email: z.string().email(),
  role: z.preprocess((value) => (typeof value === 'string' ? value.toLowerCase() : value), userRoleSchema),
  createdAt: z.string().nullable().optional(),
  supplierId: z.number().nullable().optional(),
  companyId: z.number().nullable().optional(),
  companyType: z.preprocess((value) => (typeof value === 'string' ? value.toLowerCase() : value), z.enum(COMPANY_TYPES)).nullable().optional(),
  companyName: z.string().nullable().optional(),
}).passthrough();

export type CurrentUserDTO = z.infer<typeof currentUserResponseSchema>;
