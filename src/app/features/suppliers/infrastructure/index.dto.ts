import { z } from 'zod';
import { CERTIFICATION_STATUSES } from '../../certifications';

const nullableString = z.string().nullable().optional();

export const addressResponseSchema = z.object({
  addressId: z.number().nullable().optional(),
  street: nullableString,
  number: nullableString,
  neighborhood: nullableString,
  complement: nullableString,
  zipCode: nullableString,
  city: nullableString,
  state: nullableString,
});

export const supplierResponseSchema = z.object({
  supplierId: z.number(),
  name: z.string(),
  cnpj: nullableString,
  address: addressResponseSchema.nullable().optional(),
  phone: nullableString,
  registeredAt: nullableString,
});

export const supplierCertificationSchema = z.object({
  certificationId: z.number(),
  certification: z.string(),
  issuingBody: z.string(),
  issuedAt: z.string(),
  expiresAt: z.string(),
  status: z.enum(CERTIFICATION_STATUSES),
});

export const supplierRankingSchema = supplierResponseSchema.extend({
  sustainabilityScore: z.number(),
  activeCertificationCount: z.number(),
  totalCo2Kg: z.number(),
  reportCount: z.number().int().nonnegative(),
  certifications: z.array(supplierCertificationSchema),
  co2KgPerUnit: z.number().nullable().optional(),
});

export const supplierRankingPageSchema = z.object({
  items: z.array(supplierRankingSchema),
  limit: z.number(),
  offset: z.number(),
  hasNext: z.boolean(),
  totalPages: z.number(),
});

export type SupplierResponseDTO = z.infer<typeof supplierResponseSchema>;
export type SupplierRankingDTO = z.infer<typeof supplierRankingSchema>;
