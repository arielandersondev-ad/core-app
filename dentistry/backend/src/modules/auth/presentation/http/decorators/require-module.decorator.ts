import { SetMetadata } from '@nestjs/common';
import type { DentistryModule } from '../../../application/contracts/plan-entitlements.js';

export const REQUIRED_MODULE = 'dentistry:required-module';
export const RequireModule = (module: DentistryModule) => SetMetadata(REQUIRED_MODULE, module);
