import { Controller, Delete, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GdprService } from './gdpr.service';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';

@ApiTags('gdpr')
@ApiBearerAuth()
@Controller('gdpr')
export class GdprController {
  constructor(private readonly gdpr: GdprService) {}

  @Get('export')
  exportData(@CurrentUser() user: AuthUser, @Query('userId') userId?: string) {
    return this.gdpr.exportData(user, userId);
  }

  @Delete('erase/:userId')
  erase(@CurrentUser() user: AuthUser, @Param('userId') userId: string) {
    return this.gdpr.eraseUser(user, userId);
  }
}
