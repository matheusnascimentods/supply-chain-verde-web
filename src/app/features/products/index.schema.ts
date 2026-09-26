import { z } from 'zod';
export const productCategorySchema = z.enum(['AGRICULTURE', 'LIVESTOCK', 'PROCESSED_FOOD', 'TEXTILE', 'FORESTRY', 'OTHER']);
export const productUnitSchema = z.enum(['KG', 'TON', 'LITER', 'UNIT', 'M3']);
export const productRequestSchema = z.object({ name: z.string().min(1), description: z.string(), category: productCategorySchema, unit: productUnitSchema }).passthrough();
export const productResponseSchema = z.object({
  productId: z.number(),
  name: z.string(),
  description: z.string().nullable().optional(),
  category: productCategorySchema,
  unit: productUnitSchema,
}).passthrough();
export type ProductCategory = z.infer<typeof productCategorySchema>;
export type ProductRequestDTO = z.infer<typeof productRequestSchema>;
export type ProductResponseDTO = z.infer<typeof productResponseSchema>;
