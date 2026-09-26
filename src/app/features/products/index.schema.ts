import { z } from 'zod';
export const productCategorySchema = z.enum(['FOOD', 'BEVERAGE', 'TEXTILE', 'ELECTRONICS', 'COSMETICS', 'OTHER']);
export const productUnitSchema = z.enum(['UNIT', 'KG', 'G', 'L', 'ML', 'TON', 'BOX']);
export const productRequestSchema = z.object({ name: z.string().min(1), description: z.string(), category: productCategorySchema, unit: productUnitSchema }).passthrough();
export const productResponseSchema = productRequestSchema.extend({ productId: z.number() });
export type ProductRequestDTO = z.infer<typeof productRequestSchema>;
export type ProductResponseDTO = z.infer<typeof productResponseSchema>;
