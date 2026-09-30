import { z } from 'zod';

export const auditLogResponseSchema = z.object({
  logId: z.number(),
  userId: z.number().nullable().optional(),
  userEmail: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  action: z.enum(['INSERT', 'UPDATE', 'DELETE', 'STATUS_CHANGE']),
  affectedTable: z.string().nullable().optional(),
  performedAt: z.string(),
  details: z.unknown().optional(),
}).passthrough();

const contentAuditLogPageSchema = z.object({
  content: z.array(auditLogResponseSchema),
  hasNext: z.boolean(),
}).passthrough();

const itemsAuditLogPageSchema = z.object({
  items: z.array(auditLogResponseSchema),
  hasNext: z.boolean(),
}).passthrough().transform(({ items, hasNext }) => ({ content: items, hasNext }));

// Accept the API's paginated `items` envelope and normalize it for the component.
export const auditLogPageSchema = z.union([
  itemsAuditLogPageSchema,
  contentAuditLogPageSchema,
  z.array(auditLogResponseSchema).transform((content) => ({ content, hasNext: content.length === 20 })),
]);

export type AuditLogResponseDTO = z.infer<typeof auditLogResponseSchema>;
export type AuditLogPageDTO = z.infer<typeof auditLogPageSchema>;
