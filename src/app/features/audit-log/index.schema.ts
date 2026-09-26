import { z } from 'zod';
export const auditLogResponseSchema = z.object({
  logId: z.number(),
  userId: z.number().nullable().optional(),
  action: z.enum(['INSERT', 'UPDATE', 'DELETE', 'STATUS_CHANGE']),
  affectedTable: z.string().nullable().optional(),
  performedAt: z.string(),
}).passthrough();
export type AuditLogResponseDTO = z.infer<typeof auditLogResponseSchema>;
