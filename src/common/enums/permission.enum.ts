export enum PermissionAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  EXPORT = 'export',
  APPROVE = 'approve',
  AUDIT = 'audit',
}

export enum PermissionResource {
  USERS = 'users',
  ROLES = 'roles',
  PERMISSIONS = 'permissions',
  INSURANCE_COMPANIES = 'insurance_companies',
  VEHICLE_POLICIES = 'vehicle_policies',
  VEHICLES = 'vehicles',
  TREES = 'trees',
  PLANTATION_SITES = 'plantation_sites',
  GEO_LOCATIONS = 'geo_locations',
  MONITORING = 'monitoring',
  TREE_PHOTOS = 'tree_photos',
  CARBON = 'carbon',
  QR_CODES = 'qr_codes',
  CERTIFICATES = 'certificates',
  MITRAS = 'mitras',
  RASHI_TREES = 'rashi_trees',
  NOTIFICATIONS = 'notifications',
  REPORTS = 'reports',
  CMS = 'cms',
  DASHBOARD = 'dashboard',
  AUDIT_LOGS = 'audit_logs',
  ACTIVITY_LOGS = 'activity_logs',
  SETTINGS = 'settings',
  PERSONS = 'persons',
  PERSON_IDENTITY = 'person_identity',
  TASKS = 'tasks',
  VIDHAN_SABHAS = 'vidhan_sabhas',
  LOCATIONS = 'locations',
  MAPS = 'maps',
  NEWS = 'news',
  MEDIA = 'media',
  LEADERS = 'leaders',
  PARTNERS = 'partners',
  CALL_CENTER = 'call_center',
  LANGUAGES = 'languages',
}

export type PermissionKey = `${PermissionResource}:${PermissionAction}`;

export function buildPermission(
  resource: PermissionResource,
  action: PermissionAction,
): PermissionKey {
  return `${resource}:${action}`;
}

export const ALL_PERMISSIONS: PermissionKey[] = Object.values(
  PermissionResource,
).flatMap((resource) =>
  Object.values(PermissionAction).map(
    (action) => `${resource}:${action}` as PermissionKey,
  ),
);
