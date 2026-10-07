import { z } from 'zod';

export const addressRequestSchema = z.object({
  street: z.string(), number: z.string(), neighborhood: z.string(), complement: z.string(),
  zipCode: z.string(), city: z.string(), state: z.string(),
}).passthrough();
export const addressResponseSchema = z.object({
  addressId: z.number().nullable().optional(), street: z.string().nullable().optional(),
  number: z.string().nullable().optional(), neighborhood: z.string().nullable().optional(),
  complement: z.string().nullable().optional(), zipCode: z.string().nullable().optional(),
  city: z.string().nullable().optional(), state: z.string().nullable().optional(),
}).passthrough();
export const supplierRequestSchema = z.object({ name: z.string().min(1), cnpj: z.string().min(1), address: addressRequestSchema, phone: z.string() }).passthrough();
export const supplierCertificationSchema = z.object({
  certificationId: z.number(), certification: z.string(), issuingBody: z.string(),
  issuedAt: z.string(), expiresAt: z.string(), status: z.enum(['ACTIVE', 'EXPIRED', 'SUSPENDED', 'UNDER_REVIEW']),
});
export const supplierResponseSchema = z.object({
  supplierId: z.number(), name: z.string(), cnpj: z.string().nullable().optional(),
  address: addressResponseSchema.nullable().optional(), phone: z.string().nullable().optional(),
  registeredAt: z.string().nullable().optional(),
}).passthrough();
export const supplierRankingResponseSchema = z.object({
  supplierId: z.number(), supplierName: z.string().optional(), name: z.string().optional(),
  cnpj: z.string().nullable().optional(), address: addressResponseSchema.nullable().optional(),
  phone: z.string().nullable().optional(), registeredAt: z.string().nullable().optional(),
  sustainabilityScore: z.number(), activeCertificationCount: z.number().optional(),
  activeCertifications: z.number().optional(), activeCertificationsCount: z.number().optional(),
  totalCo2Kg: z.number().optional(),
  reportCount: z.number().int().nonnegative(),
  certifications: z.array(supplierCertificationSchema),
}).passthrough();
export const supplierRankingPageSchema = z.object({
  items: z.array(supplierRankingResponseSchema),
  limit: z.number(),
  offset: z.number(),
  hasNext: z.boolean(),
  totalPages: z.number(),
});
export type AddressRequestDTO = z.infer<typeof addressRequestSchema>;
export type SupplierRequestDTO = z.infer<typeof supplierRequestSchema>;
export type SupplierResponseDTO = z.infer<typeof supplierResponseSchema>;
export type SupplierRankingResponseDTO = z.infer<typeof supplierRankingResponseSchema>;
export type SupplierCertificationDTO = z.infer<typeof supplierCertificationSchema>;
export type SupplierRankingPageDTO = z.infer<typeof supplierRankingPageSchema>;
