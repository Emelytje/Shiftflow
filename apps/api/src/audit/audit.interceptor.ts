import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';

const AUDITED_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

/**
 * Schrijft een audit-log voor elke geslaagde muterende request.
 * Bewaart nooit de request-body (privacy), enkel wie/wat/wanneer.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const method: string = req.method;

    if (!AUDITED_METHODS.has(method)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(() => {
        const user = req.user as AuthUser | undefined;
        // /api/shifts/:id -> entity "shifts"
        const path: string = req.route?.path ?? req.originalUrl ?? '';
        const segments = path.split('/').filter(Boolean);
        const apiIdx = segments.indexOf('api');
        const entity = segments[apiIdx + 1] ?? 'unknown';
        const ip =
          (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ??
          req.ip ??
          null;

        // Fire-and-forget; audit mag de request nooit doen falen.
        this.prisma.auditLog
          .create({
            data: {
              companyId: user?.companyId ?? null,
              userId: user?.userId ?? null,
              action: `${method} ${entity}`,
              entity,
              entityId: req.params?.id ?? null,
              ipAddress: ip,
            },
          })
          .catch(() => undefined);
      }),
    );
  }
}
