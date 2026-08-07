import { SetMetadata } from '@nestjs/common';
import { UserProfile } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserProfile[]) => SetMetadata(ROLES_KEY, roles);
