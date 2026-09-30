import { z } from 'zod';

export const dashboardStageTypeSchema = z.enum([
  'PRODUCTION',
  'STORAGE',
  'PROCESSING',
  'TRANSPORT',
  'DISTRIBUTION',
  'RETAIL',
]);

export const dashboardProductUnitSchema = z.enum(['KG', 'TON', 'LITER', 'UNIT', 'M3']);

export const recentBatchSummarySchema = z.object({
  batchId: z.number(),
  productName: z.string(),
  supplierName: z.string(),
  quantity: z.number(),
  unit: dashboardProductUnitSchema,
  status: dashboardStageTypeSchema,
});

export const dashboardSummaryResponseSchema = z.object({
  activeBatches: z.number().nonnegative(),
  expiringCertifications: z.number().nonnegative(),
  suppliers: z.number().nonnegative(),
  monthlyEmissionKgCo2e: z.number().nonnegative(),
  recentBatches: z.array(recentBatchSummarySchema),
});

export type DashboardStageType = z.infer<typeof dashboardStageTypeSchema>;
export type DashboardProductUnit = z.infer<typeof dashboardProductUnitSchema>;
export type RecentBatchSummary = z.infer<typeof recentBatchSummarySchema>;
export type DashboardSummaryResponse = z.infer<typeof dashboardSummaryResponseSchema>;
