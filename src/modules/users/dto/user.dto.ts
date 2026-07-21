import { z } from 'zod';
import { SystemRole } from '../../../common/enums/role.enum';

export const createUserSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  email: z.string().email(),
  phone: z.string().min(10).max(15).optional(),
  password: z.string().min(8).max(128).optional(),
  role: z.nativeEnum(SystemRole),
  permissions: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  avatar: z.string().url().optional(),
  organizationId: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
});

export const updateUserSchema = createUserSchema
  .partial()
  .omit({ email: true });

export const userQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  search: z.string().optional(),
  role: z.nativeEnum(SystemRole).optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  district: z.string().optional(),
  state: z.string().optional(),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
export type UserQueryDto = z.infer<typeof userQuerySchema>;

export const userResponseSchema = createUserSchema
  .omit({ password: true })
  .extend({
    _id: z.string(),
    isEmailVerified: z.boolean(),
    lastLoginAt: z.date().nullable().optional(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
  });
