import { z } from 'zod';
import { userRoleSchema } from '../../../core/auth/session/index.model';

export const userResponseSchema = z.object({
  userId: z.number(),
  name: z.string(),
  email: z.string().email(),
  role: z.preprocess((value) => (typeof value === 'string' ? value.toLowerCase() : value), userRoleSchema),
  createdAt: z.string().nullable().optional(),
}).passthrough();

export const userPageSchema = z.object({
  items: z.array(userResponseSchema),
  limit: z.number(),
  offset: z.number(),
  hasNext: z.boolean(),
  totalPages: z.number(),
});

export type UserResponseDTO = z.infer<typeof userResponseSchema>;
export type UserPageDTO = z.infer<typeof userPageSchema>;
