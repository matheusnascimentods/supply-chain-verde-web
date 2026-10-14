import { z } from 'zod';
import { PRODUCT_UNITS, STAGE_TYPES } from '../../batches';

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
  suppliers: z.number().nonnegative(),
  monthlyEmissionKgCo2e: z.number().nonnegative(),
  recentBatches: z.array(recentBatchSchema),
});

export const monthlyEmissionsResponseSchema = z.array(
  z.object({
    month: z.string().regex(/^\d{4}-\d{2}$/),
    co2Kg: z.number().nonnegative(),
  }),
);
