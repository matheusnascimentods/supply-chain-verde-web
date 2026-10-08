import { z } from 'zod';
import { STAGE_TYPES } from '../domain/stage/index.model';
import { stageResponseSchema } from './stage/index.dto';

export const batchResponseSchema = z.object({
  batchId: z.number(),
  productId: z.number().nullable(),
  productName: z.string().nullable(),
  supplierId: z.number().nullable(),
  supplierName: z.string().nullable(),
  quantity: z.number(),
  producedAt: z.string(),
  currentStage: z.enum(STAGE_TYPES).nullable(),
  stages: z.array(stageResponseSchema),
});

export const batchPageSchema = z.object({
  content: z.array(batchResponseSchema),
  page: z.number(),
  size: z.number(),
  totalElements: z.number(),
  totalPages: z.number(),
});
