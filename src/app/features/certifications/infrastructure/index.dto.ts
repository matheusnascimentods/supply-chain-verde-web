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

export type CertificationResponseDTO = z.infer<typeof certificationResponseSchema>;
