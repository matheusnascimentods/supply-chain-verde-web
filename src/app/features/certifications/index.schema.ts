import { z } from 'zod';
export const certificationStatusSchema = z.enum(['active', 'expired', 'suspended', 'underReview']);
export const certificationRequestSchema = z.object({ name: z.string().min(1), issuingOrganization: z.string().min(1), certificationNumber: z.string(), issuedAt: z.string(), expiresAt: z.string(), documentUrl: z.string().optional() }).passthrough();
export const certificationResponseSchema = certificationRequestSchema.extend({ certificationId: z.number(), supplierId: z.number(), status: certificationStatusSchema });
export type CertificationRequestDTO = z.infer<typeof certificationRequestSchema>;
export type CertificationResponseDTO = z.infer<typeof certificationResponseSchema>;
