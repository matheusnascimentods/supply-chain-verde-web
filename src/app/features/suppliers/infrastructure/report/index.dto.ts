import { z } from 'zod';
import { CALCULATION_METHODS, PRODUCT_UNITS, STAGE_TYPES } from '../../../batches';
import { addressResponseSchema, supplierCertificationSchema } from '../index.dto';

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

export const reportDetailSchema = reportListItemSchema.extend({
  trackedProductCount: z.number().nullable().optional(),
  supplier: z.object({ phone: z.string().nullable().optional(), address: addressResponseSchema.nullable().optional() }),
  emissions: z.object({
    byStage: z.array(z.object({ stageType: z.enum(STAGE_TYPES), co2Kg: z.number() })),
    byBatch: z.array(
      z.object({ batchId: z.number(), productName: z.string(), quantity: z.number(), unit: z.enum(PRODUCT_UNITS), co2Kg: z.number() }),
    ),
    byMethod: z.array(z.object({ calculationMethod: z.enum(CALCULATION_METHODS), emissionFactor: z.number(), co2Kg: z.number() })),
  }),
  certifications: z.array(supplierCertificationSchema),
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
