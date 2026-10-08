import { z } from 'zod';
import { carbonEmissionResponseSchema, stageResponseSchema } from '../batches';
import type { CarbonEmission, Stage } from '../batches';

export const batchTraceabilityResponseSchema = z.object({
  batchId: z.number(),
  productName: z.string(),
  supplierName: z.string(),
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

export type ChainResponseDTO = Stage;
export type CarbonEmissionResponseDTO = CarbonEmission;
export type BatchTraceabilityResponseDTO = z.infer<typeof batchTraceabilityResponseSchema>;
export type CarbonFootprintResponseDTO = z.infer<typeof carbonFootprintResponseSchema>;
