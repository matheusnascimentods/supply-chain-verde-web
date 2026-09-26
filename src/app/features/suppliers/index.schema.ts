import { z } from 'zod';

export const addressRequestSchema = z.object({
  street: z.string(), number: z.string(), neighborhood: z.string(), complement: z.string(),
  zipCode: z.string(), city: z.string(), state: z.string(),
}).passthrough();
export const addressResponseSchema = addressRequestSchema.extend({ addressId: z.number().optional() });
export const supplierRequestSchema = z.object({ name: z.string().min(1), cnpj: z.string().min(1), address: addressRequestSchema, phone: z.string() }).passthrough();
export const supplierResponseSchema = supplierRequestSchema.extend({ supplierId: z.number(), registeredAt: z.string().optional() });
export const supplierRankingResponseSchema = z.object({ supplierId: z.number(), supplierName: z.string().optional(), name: z.string().optional(), sustainabilityScore: z.number(), activeCertifications: z.number().optional(), activeCertificationsCount: z.number().optional(), totalCo2Kg: z.number().optional() }).passthrough();
export type AddressRequestDTO = z.infer<typeof addressRequestSchema>;
export type SupplierRequestDTO = z.infer<typeof supplierRequestSchema>;
export type SupplierResponseDTO = z.infer<typeof supplierResponseSchema>;
export type SupplierRankingResponseDTO = z.infer<typeof supplierRankingResponseSchema>;
