import { Module } from '@nestjs/common';
import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';

const APPROVER_ROLES: Role[] = [Role.OWNER, Role.MANAGER, Role.TEAM_LEAD, Role.HR];

class CreateAvailabilityDto {
  @IsInt() @Min(0) @Max(6) weekday!: number; // 0=zo .. 6=za
  @IsString() startTime!: string; // "09:00"
  @IsString() endTime!: string; // "17:00"
  @IsOptional() @IsBoolean() isAvailable?: boolean;
}

@Injectable()
class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  list(user: AuthUser, targetUserId?: string) {
    const userId =
      targetUserId && APPROVER_ROLES.includes(user.role as Role)
        ? targetUserId
        : user.userId;
    return this.prisma.availability.findMany({
      where: { userId },
      orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }],
    });
  }

  create(user: AuthUser, dto: CreateAvailabilityDto) {
    return this.prisma.availability.create({
      data: {
        userId: user.userId,
        weekday: dto.weekday,
        startTime: dto.startTime,
        endTime: dto.endTime,
        isAvailable: dto.isAvailable ?? true,
      },
    });
  }

  async remove(user: AuthUser, id: string) {
    const existing = await this.prisma.availability.findFirst({
      where: { id, userId: user.userId },
    });
    if (!existing) throw new NotFoundException('Beschikbaarheid niet gevonden');
    await this.prisma.availability.delete({ where: { id } });
    return { success: true };
  }
}

@ApiTags('availability')
@ApiBearerAuth()
@Controller('availability')
class AvailabilityController {
  constructor(private readonly service: AvailabilityService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query('userId') userId?: string) {
    return this.service.list(user, userId);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateAvailabilityDto) {
    return this.service.create(user, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.remove(user, id);
  }
}

@Module({
  controllers: [AvailabilityController],
  providers: [AvailabilityService],
})
export class AvailabilityModule {}
