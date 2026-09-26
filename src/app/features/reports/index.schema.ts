import { z } from 'zod';
export const reportRequestSchema = z.object({ startDate: z.string(), endDate: z.string() }).passthrough();
export const reportResponseSchema = z.object({ reportId: z.number(), supplierId: z.number(), startDate: z.string(), endDate: z.string(), totalCo2Kg: z.number(), trackedProducts: z.number(), generatedAt: z.string().optional() }).passthrough();
export type ReportRequestDTO = z.infer<typeof reportRequestSchema>;
export type ReportResponseDTO = z.infer<typeof reportResponseSchema>;
