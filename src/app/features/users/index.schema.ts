import { z } from 'zod';
import { userRoleSchema } from '../../core/session/index.schema';
export { userRoleSchema } from '../../core/session/index.schema';
export const userRequestSchema = z.object({ name: z.string().min(1), email: z.string().email(), password: z.string().min(1), role: userRoleSchema }).passthrough();
export const userResponseSchema = z.object({ userId: z.number(), name: z.string(), email: z.string().email(), role: userRoleSchema }).passthrough();
export const updateUserRoleSchema = z.object({ role: userRoleSchema });
export type UserRequestDTO = z.infer<typeof userRequestSchema>;
export type UserResponseDTO = z.infer<typeof userResponseSchema>;
