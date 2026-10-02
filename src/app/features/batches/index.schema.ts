import { z } from 'zod';
import { chainResponseSchema, stageTypeSchema } from '../traceability/index.schema';

export const batchRequestSchema = z.object({
  productId: z.number().int().positive(),
  supplierId: z.number().int().positive(),
  quantity: z.number().positive(),
  producedAt: z.string().min(1),
});

export const batchResponseSchema = z.object({
  batchId: z.number(),
  productId: z.number().nullable(),
  productName: z.string().nullable(),
  supplierId: z.number().nullable(),
  supplierName: z.string().nullable(),
  quantity: z.number(),
  producedAt: z.string(),
  currentStage: stageTypeSchema.nullable(),
  stages: z.array(chainResponseSchema),
});

export const batchPageSchema = z.object({
  content: z.array(batchResponseSchema),
  page: z.number(),
  size: z.number(),
  totalElements: z.number(),
  totalPages: z.number(),
});

export type BatchRequestDTO = z.infer<typeof batchRequestSchema>;
export type BatchResponseDTO = z.infer<typeof batchResponseSchema>;
export type BatchPageDTO = z.infer<typeof batchPageSchema>;
