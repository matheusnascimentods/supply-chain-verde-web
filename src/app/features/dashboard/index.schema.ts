import { z } from 'zod';
import { userRoleSchema } from '../../core/session/index.schema';

export const dashboardLinkSchema = z.object({
  label: z.string().min(1),
  path: z.string().regex(/^\/.+/, 'O caminho do dashboard deve ser absoluto.'),
});

export const roleDashboardSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  links: z.array(dashboardLinkSchema).min(1),
});

export const roleDashboardsSchema = z.record(userRoleSchema, roleDashboardSchema);

export type DashboardLink = z.infer<typeof dashboardLinkSchema>;
export type RoleDashboard = z.infer<typeof roleDashboardSchema>;
