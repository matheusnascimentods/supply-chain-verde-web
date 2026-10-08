import { z } from 'zod';
import { PRODUCT_CATEGORIES, PRODUCT_UNITS } from '../../domain/product/index.model';

export const productResponseSchema = z.object({
  productId: z.number(),
  name: z.string(),
  description: z.string().nullable().optional(),
  category: z.enum(PRODUCT_CATEGORIES),
  unit: z.enum(PRODUCT_UNITS),
});

export const productPageSchema = z.object({
  items: z.array(productResponseSchema),
  limit: z.number(),
  offset: z.number(),
  hasNext: z.boolean(),
  totalPages: z.number(),
});
