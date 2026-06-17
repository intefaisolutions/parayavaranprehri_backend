import { z } from 'zod';
import { SystemRole } from '../../../common/enums/role.enum';

export const createRoleSchema = z.object({
  name: z.nativeEnum(SystemRole),
  displayName: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  permissionKeys: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});

export const updateRoleSchema = createRoleSchema.partial();

export const roleQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  search: z.string().optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
});

export type CreateRoleDto = z.infer<typeof createRoleSchema>;
export type UpdateRoleDto = z.infer<typeof updateRoleSchema>;
export type RoleQueryDto = z.infer<typeof roleQuerySchema>;
