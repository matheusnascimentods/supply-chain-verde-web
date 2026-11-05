import { z } from 'zod';

export const plansResponseSchema = z.array(
  z.object({
    code: z.string(),
    name: z.string(),
    maxUsers: z.number(),
  }),
);
