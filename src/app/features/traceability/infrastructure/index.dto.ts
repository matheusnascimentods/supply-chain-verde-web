import { z } from 'zod';
import { carbonEmissionResponseSchema, stageResponseSchema } from '../../batches';

export const batchTraceabilityResponseSchema = z.object({
  batchId: z.number(),
  productName: z.string().nullable(),
  supplierName: z.string().nullable(),
  quantity: z.number(),
  producedAt: z.string(),
  stages: z.array(stageResponseSchema),
  totalCo2Kg: z.number(),
});

export const carbonFootprintResponseSchema = z.object({
  batchId: z.number(),
  totalCo2Kg: z.number(),
  emissionsByStage: z.array(carbonEmissionResponseSchema),
});
