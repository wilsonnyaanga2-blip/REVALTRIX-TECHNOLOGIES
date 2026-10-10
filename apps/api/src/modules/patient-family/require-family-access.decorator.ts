import { SetMetadata } from '@nestjs/common';
import type { AccessPermission } from './family-access.service.js';

export const REQUIRED_FAMILY_ACCESS_KEY = 'required_family_access';

export interface RequiredFamilyAccess {
  permission: AccessPermission;
  resourceType:
    | 'PROFILE'
    | 'APPOINTMENTS'
    | 'REMINDERS'
    | 'DOCUMENTS'
    | 'LAB_RESULTS'
    | 'PRESCRIPTIONS'
    | 'BILLING'
    | 'MESSAGES';
  action?: 'VIEW' | 'DOWNLOAD' | 'CREATE' | 'UPDATE' | 'CANCEL';
}

export const RequireFamilyAccess = (
  permission: AccessPermission,
  resourceType: RequiredFamilyAccess['resourceType'],
  action?: RequiredFamilyAccess['action'],
) =>
  SetMetadata(REQUIRED_FAMILY_ACCESS_KEY, {
    permission,
    resourceType,
    ...(action ? { action } : {}),
  } satisfies RequiredFamilyAccess);
