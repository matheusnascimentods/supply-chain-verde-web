import { z } from 'zod';
import { CERTIFICATION_STATUSES } from '../domain/index.model';

export const certificationResponseSchema = z.object({
  certificationId: z.number(),
  supplierId: z.number(),
  certification: z.string(),
  issuingBody: z.string(),
  issuedAt: z.string(),
  expiresAt: z.string(),
  status: z.enum(CERTIFICATION_STATUSES),
});

export const certificationPageSchema = z.object({
  content: z.array(certificationResponseSchema),
  page: z.number(),
  size: z.number(),
  totalElements: z.number(),
  totalPages: z.number(),
});

export type CertificationResponseDTO = z.infer<typeof certificationResponseSchema>;
