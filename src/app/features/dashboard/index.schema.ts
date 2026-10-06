import { z } from 'zod';
import { userRoleSchema } from '../../core/auth/session/index.model';

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

export const dashboardLinkSchema = z.object({
  label: z.string().min(1),
  path: z.string().regex(/^\/.+/, 'O caminho do dashboard deve ser absoluto.'),
});

export const roleDashboardSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  links: z.array(dashboardLinkSchema).min(1),
});

export const roleDashboardsSchema = z.record(userRoleSchema, roleDashboardSchema);

export type DashboardLink = z.infer<typeof dashboardLinkSchema>;
export type RoleDashboard = z.infer<typeof roleDashboardSchema>;
export type DashboardStageType = z.infer<typeof dashboardStageTypeSchema>;
export type DashboardProductUnit = z.infer<typeof dashboardProductUnitSchema>;
export type RecentBatchSummary = z.infer<typeof recentBatchSummarySchema>;
export type DashboardSummaryResponse = z.infer<typeof dashboardSummaryResponseSchema>;
