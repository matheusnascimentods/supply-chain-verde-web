import { z } from 'zod';

export const viaCepResponseSchema = z.object({
  logradouro: z.string().optional(),
  bairro: z.string().optional(),
  localidade: z.string().optional(),
  uf: z.string().optional(),
  erro: z.union([z.boolean(), z.literal('true'), z.literal('false')]).optional(),
}).passthrough();

export type ViaCepResponseDTO = z.infer<typeof viaCepResponseSchema>;
