import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';

/** Beperkt een route tot de opgegeven rollen. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
