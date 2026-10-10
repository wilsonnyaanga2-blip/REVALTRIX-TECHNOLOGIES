import { SetMetadata } from '@nestjs/common';

export const REQUIRE_FAMILY_STEP_UP = 'require_family_step_up';

export const RequireFamilyStepUp = () => SetMetadata(REQUIRE_FAMILY_STEP_UP, true);
