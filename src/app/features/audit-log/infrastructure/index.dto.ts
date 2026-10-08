import { z } from 'zod';
import { AUDIT_ACTIONS } from '../domain/index.model';

export const auditLogResponseSchema = z.object({
  logId: z.number(),
  userId: z.number().nullable().optional(),
  userEmail: z.string().nullable().optional(),
  action: z.enum(AUDIT_ACTIONS),
  affectedTable: z.string().nullable().optional(),
  affectedEntityId: z.number().nullable().optional(),
  beforeData: z.record(z.string(), z.unknown()).nullable().optional(),
  afterData: z.record(z.string(), z.unknown()).nullable().optional(),
  performedAt: z.string(),
});

export const auditLogPageSchema = z.object({
  items: z.array(auditLogResponseSchema),
  limit: z.number(),
  offset: z.number(),
  hasNext: z.boolean(),
  totalPages: z.number(),
});
