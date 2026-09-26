import { z } from 'zod';
export const batchStatusSchema = z.enum(['CREATED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']);
export const batchRequestSchema = z.object({ productId: z.number(), quantity: z.number().positive(), producedAt: z.string(), expirationDate: z.string().optional(), description: z.string().optional() }).passthrough();
export const batchResponseSchema = batchRequestSchema.extend({ batchId: z.number(), supplierId: z.number(), status: batchStatusSchema.optional() });
export type BatchRequestDTO = z.infer<typeof batchRequestSchema>;
export type BatchResponseDTO = z.infer<typeof batchResponseSchema>;
