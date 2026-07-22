import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TimeTrackingService } from './time-tracking.service';
import { ClockInDto, ClockOutDto } from './dto/clock.dto';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';

@ApiTags('time-tracking')
@ApiBearerAuth()
@Controller('time-entries')
export class TimeTrackingController {
  constructor(private readonly time: TimeTrackingService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.time.findAll(user, from, to);
  }

  @Get('current')
  current(@CurrentUser() user: AuthUser) {
    return this.time.currentOpen(user.userId);
  }

  @Post('clock-in')
  clockIn(@CurrentUser() user: AuthUser, @Body() dto: ClockInDto) {
    return this.time.clockIn(user, dto);
  }

  @Post('clock-out')
  clockOut(@CurrentUser() user: AuthUser, @Body() dto: ClockOutDto) {
    return this.time.clockOut(user, dto);
  }

  @Patch(':id/approve')
  approve(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.time.approve(user, id);
  }
}
