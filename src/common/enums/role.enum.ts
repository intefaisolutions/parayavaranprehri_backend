export enum SystemRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  INSURANCE_COMPANY = 'insurance_company',
  PLANTATION_PARTNER = 'plantation_partner',
  FIELD_OFFICER = 'field_officer',
  GOVERNMENT_OFFICER = 'government_officer',
  CUSTOMER = 'customer',
  AUDITOR = 'auditor',
}

export const ALL_SYSTEM_ROLES = Object.values(SystemRole);
