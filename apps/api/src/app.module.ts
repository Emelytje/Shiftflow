import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CompaniesModule } from './companies/companies.module';
import { SchedulingModule } from './scheduling/scheduling.module';
import { LeaveModule } from './leave/leave.module';
import { TimeTrackingModule } from './time-tracking/time-tracking.module';
import { AiModule } from './ai/ai.module';
import { GdprModule } from './gdpr/gdpr.module';
import { ReportingModule } from './reporting/reporting.module';
import { DepartmentsModule } from './departments/departments.module';
import { LocationsModule } from './locations/locations.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AvailabilityModule } from './availability/availability.module';
import { AuditModule } from './audit/audit.module';
import { HealthModule } from './health/health.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    CompaniesModule,
    SchedulingModule,
    LeaveModule,
    TimeTrackingModule,
    AiModule,
    GdprModule,
    ReportingModule,
    DepartmentsModule,
    LocationsModule,
    NotificationsModule,
    AvailabilityModule,
    AuditModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
