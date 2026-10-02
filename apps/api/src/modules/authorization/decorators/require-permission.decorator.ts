import { SetMetadata } from '@nestjs/common';

export const REQUIRED_PERMISSION_KEY = 'required_permission';

export const RequirePermission = (
  resource: string,
  action: string,
) =>
  SetMetadata(REQUIRED_PERMISSION_KEY, {
    resource,
    action,
  });
