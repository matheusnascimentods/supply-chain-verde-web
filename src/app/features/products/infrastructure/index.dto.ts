import { z } from 'zod';
import { PRODUCT_CATEGORIES, PRODUCT_UNITS } from '../domain/index.model';

export const productResponseSchema = z.object({
  productId: z.number(),
  supplierId: z.number().nullable().optional(),
  name: z.string(),
  description: z.string().nullable().optional(),
  category: z.enum(PRODUCT_CATEGORIES),
  unit: z.enum(PRODUCT_UNITS),
  supplierName: z.string().nullable().optional(),
  co2KgPerUnit: z.number().nullable().optional(),
  acceptedBatchesLast30Days: z.number().nullable().optional(),
});

export const productPageSchema = z.object({
  items: z.array(productResponseSchema),
  limit: z.number(),
  offset: z.number(),
  hasNext: z.boolean(),
  totalPages: z.number(),
});
