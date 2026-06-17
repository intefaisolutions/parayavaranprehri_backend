import {
  ALL_PERMISSIONS,
  PermissionAction,
  PermissionResource,
} from '../../../common/enums/permission.enum';
import { SystemRole } from '../../../common/enums/role.enum';

export const ROLE_SEED_DATA: Array<{
  name: SystemRole;
  displayName: string;
  description: string;
  permissionKeys: string[];
}> = [
  {
    name: SystemRole.SUPER_ADMIN,
    displayName: 'Super Admin',
    description: 'Full system access',
    permissionKeys: [...ALL_PERMISSIONS],
  },
  {
    name: SystemRole.ADMIN,
    displayName: 'Admin',
    description: 'Platform administrator',
    permissionKeys: ALL_PERMISSIONS.filter(
      (p) => !p.startsWith(`${PermissionResource.SETTINGS}:`),
    ),
  },
  {
    name: SystemRole.INSURANCE_COMPANY,
    displayName: 'Insurance Company',
    description: 'Insurance company portal access',
    permissionKeys: [
      `${PermissionResource.VEHICLE_POLICIES}:${PermissionAction.LIST}`,
      `${PermissionResource.VEHICLE_POLICIES}:${PermissionAction.READ}`,
      `${PermissionResource.VEHICLE_POLICIES}:${PermissionAction.CREATE}`,
      `${PermissionResource.VEHICLE_POLICIES}:${PermissionAction.UPDATE}`,
      `${PermissionResource.VEHICLES}:${PermissionAction.LIST}`,
      `${PermissionResource.VEHICLES}:${PermissionAction.READ}`,
      `${PermissionResource.CERTIFICATES}:${PermissionAction.LIST}`,
      `${PermissionResource.CERTIFICATES}:${PermissionAction.READ}`,
      `${PermissionResource.DASHBOARD}:${PermissionAction.READ}`,
      `${PermissionResource.REPORTS}:${PermissionAction.LIST}`,
      `${PermissionResource.REPORTS}:${PermissionAction.EXPORT}`,
    ],
  },
  {
    name: SystemRole.PLANTATION_PARTNER,
    displayName: 'Plantation Partner',
    description: 'Plantation partner operations',
    permissionKeys: [
      `${PermissionResource.PLANTATION_SITES}:${PermissionAction.LIST}`,
      `${PermissionResource.PLANTATION_SITES}:${PermissionAction.READ}`,
      `${PermissionResource.PLANTATION_SITES}:${PermissionAction.CREATE}`,
      `${PermissionResource.PLANTATION_SITES}:${PermissionAction.UPDATE}`,
      `${PermissionResource.TREES}:${PermissionAction.LIST}`,
      `${PermissionResource.TREES}:${PermissionAction.READ}`,
      `${PermissionResource.TREES}:${PermissionAction.CREATE}`,
      `${PermissionResource.TREES}:${PermissionAction.UPDATE}`,
      `${PermissionResource.TREE_PHOTOS}:${PermissionAction.CREATE}`,
      `${PermissionResource.MONITORING}:${PermissionAction.CREATE}`,
      `${PermissionResource.DASHBOARD}:${PermissionAction.READ}`,
    ],
  },
  {
    name: SystemRole.FIELD_OFFICER,
    displayName: 'Field Officer',
    description: 'On-ground field operations',
    permissionKeys: [
      `${PermissionResource.TREES}:${PermissionAction.LIST}`,
      `${PermissionResource.TREES}:${PermissionAction.READ}`,
      `${PermissionResource.TREES}:${PermissionAction.UPDATE}`,
      `${PermissionResource.TREE_PHOTOS}:${PermissionAction.CREATE}`,
      `${PermissionResource.MONITORING}:${PermissionAction.CREATE}`,
      `${PermissionResource.MONITORING}:${PermissionAction.UPDATE}`,
      `${PermissionResource.GEO_LOCATIONS}:${PermissionAction.READ}`,
      `${PermissionResource.QR_CODES}:${PermissionAction.READ}`,
    ],
  },
  {
    name: SystemRole.GOVERNMENT_OFFICER,
    displayName: 'Government Officer',
    description: 'Government oversight and analytics',
    permissionKeys: [
      `${PermissionResource.DASHBOARD}:${PermissionAction.READ}`,
      `${PermissionResource.REPORTS}:${PermissionAction.LIST}`,
      `${PermissionResource.REPORTS}:${PermissionAction.EXPORT}`,
      `${PermissionResource.TREES}:${PermissionAction.LIST}`,
      `${PermissionResource.TREES}:${PermissionAction.READ}`,
      `${PermissionResource.PLANTATION_SITES}:${PermissionAction.LIST}`,
      `${PermissionResource.PLANTATION_SITES}:${PermissionAction.READ}`,
      `${PermissionResource.CARBON}:${PermissionAction.READ}`,
    ],
  },
  {
    name: SystemRole.CUSTOMER,
    displayName: 'Customer',
    description: 'End customer portal',
    permissionKeys: [
      `${PermissionResource.VEHICLES}:${PermissionAction.LIST}`,
      `${PermissionResource.VEHICLES}:${PermissionAction.READ}`,
      `${PermissionResource.CERTIFICATES}:${PermissionAction.LIST}`,
      `${PermissionResource.CERTIFICATES}:${PermissionAction.READ}`,
      `${PermissionResource.TREES}:${PermissionAction.LIST}`,
      `${PermissionResource.TREES}:${PermissionAction.READ}`,
      `${PermissionResource.DASHBOARD}:${PermissionAction.READ}`,
    ],
  },
  {
    name: SystemRole.AUDITOR,
    displayName: 'Auditor',
    description: 'Audit and compliance access',
    permissionKeys: [
      `${PermissionResource.AUDIT_LOGS}:${PermissionAction.LIST}`,
      `${PermissionResource.AUDIT_LOGS}:${PermissionAction.READ}`,
      `${PermissionResource.ACTIVITY_LOGS}:${PermissionAction.LIST}`,
      `${PermissionResource.ACTIVITY_LOGS}:${PermissionAction.READ}`,
      `${PermissionResource.REPORTS}:${PermissionAction.LIST}`,
      `${PermissionResource.REPORTS}:${PermissionAction.EXPORT}`,
      `${PermissionResource.TREES}:${PermissionAction.AUDIT}`,
      `${PermissionResource.CARBON}:${PermissionAction.AUDIT}`,
    ],
  },
];
