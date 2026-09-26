import { z } from 'zod';
export const auditLogResponseSchema = z.object({ auditLogId: z.number(), userId: z.number(), action: z.string(), entity: z.string().optional(), tableAffected: z.string().optional(), timestamp: z.string(), details: z.string().optional() }).passthrough();
export type AuditLogResponseDTO = z.infer<typeof auditLogResponseSchema>;
