import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Markeert een route als publiek (skip JWT-guard). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
