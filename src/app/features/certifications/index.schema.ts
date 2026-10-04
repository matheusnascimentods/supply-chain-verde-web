import { z } from 'zod';

export const certificationStatusSchema = z.enum(['active', 'expired', 'suspended', 'underReview']);

const normalizedStatusSchema = z.preprocess((value) => {
  if (typeof value !== 'string') return value;
  const normalized = value.replace(/[\s_-]/g, '').toLowerCase();
  const statuses: Record<string, string> = {
    active: 'active',
    expired: 'expired',
    suspended: 'suspended',
    underreview: 'underReview',
  };
  return statuses[normalized] ?? value;
}, certificationStatusSchema);

export const certificationRequestSchema = z
  .object({
    name: z.string().min(1),
    issuingOrganization: z.string().min(1),
    issuedAt: z.string(),
    expiresAt: z.string(),
  });

const certificationApiResponseSchema = z
  .object({
    certificationId: z.number(),
    supplierId: z.number(),
    name: z.string().optional(),
    certification: z.string().optional(),
    issuingOrganization: z.string().optional(),
    issuingBody: z.string().optional(),
    certificationNumber: z.union([z.string(), z.number()]).nullable().optional(),
    issuedAt: z.string(),
    expiresAt: z.string(),
    documentUrl: z.string().nullable().optional(),
    supplierName: z.string().nullable().optional(),
    supplier: z.unknown().optional(),
    status: normalizedStatusSchema,
  })
  .passthrough()
  .transform((item) => ({
    ...item,
    name: item.name ?? item.certification ?? '',
    issuingOrganization: item.issuingOrganization ?? item.issuingBody ?? '',
    certificationNumber: String(item.certificationNumber ?? ''),
    documentUrl: item.documentUrl ?? undefined,
  }));

export const certificationResponseSchema = certificationApiResponseSchema;

export type CertificationRequestDTO = z.infer<typeof certificationRequestSchema>;
export type CertificationResponseDTO = z.infer<typeof certificationResponseSchema>;
export type CertificationStatus = z.infer<typeof certificationStatusSchema>;
