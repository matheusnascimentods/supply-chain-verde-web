import { z } from 'zod';

export const auditLogResponseSchema = z.object({
  logId: z.number(),
  userId: z.number().nullable().optional(),
  userEmail: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  action: z.enum(['INSERT', 'UPDATE', 'DELETE', 'STATUS_CHANGE']),
  affectedTable: z.string().nullable().optional(),
  affectedEntityId: z.number().nullable().optional(),
  beforeData: z.record(z.string(), z.unknown()).nullable().optional(),
  afterData: z.record(z.string(), z.unknown()).nullable().optional(),
  performedAt: z.string(),
  details: z.unknown().optional(),
}).passthrough();

const contentAuditLogPageSchema = z.object({
  content: z.array(auditLogResponseSchema),
  hasNext: z.boolean(),
  totalPages: z.number(),
}).passthrough();

const itemsAuditLogPageSchema = z.object({
  items: z.array(auditLogResponseSchema),
  hasNext: z.boolean(),
  totalPages: z.number(),
}).passthrough().transform(({ items, hasNext, totalPages }) => ({ content: items, hasNext, totalPages }));

// Accept the API's paginated `items` envelope and normalize it for the component.
export const auditLogPageSchema = z.union([
  itemsAuditLogPageSchema,
  contentAuditLogPageSchema,
  z.array(auditLogResponseSchema).transform((content) => ({ content, hasNext: content.length === 20, totalPages: content.length === 0 ? 0 : 1 })),
]);

export type AuditLogResponseDTO = z.infer<typeof auditLogResponseSchema>;
export type AuditLogPageDTO = z.infer<typeof auditLogPageSchema>;
