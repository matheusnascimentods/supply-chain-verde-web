import { z } from 'zod';
export const reportRequestSchema = z.object({ periodStartAt: z.string(), periodEndAt: z.string() }).passthrough();
export const reportResponseSchema = z.object({
  reportId: z.number(),
  supplierId: z.number(),
  supplierCnpj: z.string().nullable().optional(),
  supplierName: z.string().nullable().optional(),
  periodStartAt: z.string().optional(),
  periodEndAt: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  totalCo2Kg: z.number(),
  totalBatchCount: z.number().optional(),
  trackedProducts: z.number().optional(),
  generatedAt: z.string().nullable().optional(),
}).passthrough();
export const reportPageSchema = z.object({
  items: z.array(reportResponseSchema),
  limit: z.number(),
  offset: z.number(),
  hasNext: z.boolean(),
  totalPages: z.number(),
}).passthrough();
export type ReportRequestDTO = z.infer<typeof reportRequestSchema>;
export type ReportResponseDTO = z.infer<typeof reportResponseSchema>;
export type ReportPageDTO = z.infer<typeof reportPageSchema>;
