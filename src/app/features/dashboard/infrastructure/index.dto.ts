import { z } from 'zod';
import { PRODUCT_UNITS, STAGE_TYPES } from '../../batches';
import { MONTH_PATTERN } from '../domain/index.model';

export const recentBatchSchema = z.object({
  batchId: z.number(),
  productName: z.string(),
  supplierName: z.string(),
  quantity: z.number(),
  unit: z.enum(PRODUCT_UNITS),
  status: z.enum(STAGE_TYPES),
});

export const dashboardSummaryResponseSchema = z.object({
  activeBatches: z.number().nonnegative(),
  expiringCertifications: z.number().nonnegative(),
  // RN-13c: o mercado recebe `suppliers` e o fornecedor recebe `pendingBatches`; o outro vem nulo.
  suppliers: z.number().nonnegative().nullable(),
  pendingBatches: z.number().nonnegative().nullable(),
  monthlyEmissionKgCo2e: z.number().nonnegative(),
  recentBatches: z.array(recentBatchSchema),
});

export const monthlyEmissionsResponseSchema = z.array(
  z.object({
    month: z.string().regex(MONTH_PATTERN),
    co2Kg: z.number().nonnegative(),
  }),
);
