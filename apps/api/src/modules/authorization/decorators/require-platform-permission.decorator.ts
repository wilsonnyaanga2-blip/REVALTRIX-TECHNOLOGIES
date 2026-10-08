import { SetMetadata } from '@nestjs/common';
import type { RequiredPermission } from '../types/authorization.types.js';

export const REQUIRED_PLATFORM_PERMISSION_KEY =
  'required_platform_permission';

export const RequirePlatformPermission = (
  resource: string,
  action: string,
) =>
  SetMetadata(REQUIRED_PLATFORM_PERMISSION_KEY, {
    resource,
    action,
  } satisfies RequiredPermission);
