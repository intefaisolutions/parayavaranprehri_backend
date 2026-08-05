import { z } from 'zod';
import { SystemRole } from '../../../common/enums/role.enum';

const ROLE_DISPLAY_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  insurance_company: 'Insurance Company',
  plantation_partner: 'Plantation Partner',
  field_officer: 'Field Officer',
  government_officer: 'Government Officer',
  customer: 'Customer',
  auditor: 'Auditor',
};

function fallbackDisplayName(name: unknown): string {
  const key = String(name || '').trim();
  if (!key) return '';
  return (
    ROLE_DISPLAY_LABELS[key] ||
    key
      .split('_')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
  );
}

export const createRoleSchema = z.preprocess((raw) => {
  const data =
    raw && typeof raw === 'object' ? { ...(raw as Record<string, unknown>) } : {};
  const trimmed = String(data.displayName ?? '').trim();
  data.displayName =
    trimmed.length >= 2 ? trimmed : fallbackDisplayName(data.name);
  if (typeof data.description === 'string') {
    const desc = data.description.trim();
    data.description = desc || undefined;
  }
  return data;
}, z.object({
  name: z.nativeEnum(SystemRole),
  displayName: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  permissionKeys: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
}));

export const updateRoleSchema = z.preprocess((raw) => {
  const data =
    raw && typeof raw === 'object' ? { ...(raw as Record<string, unknown>) } : {};
  if (data.displayName !== undefined) {
    const trimmed = String(data.displayName ?? '').trim();
    data.displayName =
      trimmed.length >= 2 ? trimmed : fallbackDisplayName(data.name);
  }
  if (typeof data.description === 'string') {
    const desc = data.description.trim();
    data.description = desc || undefined;
  }
  return data;
}, z
  .object({
    name: z.nativeEnum(SystemRole),
    displayName: z.string().min(2).max(100),
    description: z.string().max(500).optional(),
    permissionKeys: z.array(z.string()),
    isActive: z.boolean(),
  })
  .partial());

export const roleQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(500).optional(),
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
