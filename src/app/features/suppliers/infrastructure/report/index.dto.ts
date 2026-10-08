import { z } from 'zod';

export const reportListItemSchema = z.object({
  reportId: z.number(),
  supplierId: z.number(),
  supplierCnpj: z.string().nullable().optional(),
  supplierName: z.string().nullable().optional(),
  periodStartAt: z.string(),
  periodEndAt: z.string(),
  totalCo2Kg: z.number(),
  totalBatchCount: z.number(),
  generatedAt: z.string().nullable().optional(),
});

export const reportPageSchema = z.object({
  items: z.array(reportListItemSchema),
  limit: z.number(),
  offset: z.number(),
  hasNext: z.boolean(),
  totalPages: z.number(),
});

export const generatedReportSchema = z.object({
  reportId: z.number(),
  supplierId: z.number(),
  periodStartAt: z.string(),
  periodEndAt: z.string(),
  totalCo2Kg: z.number(),
  trackedProductCount: z.number().nullable().optional(),
  generatedAt: z.string().nullable().optional(),
});

export type GeneratedReportDTO = z.infer<typeof generatedReportSchema>;
