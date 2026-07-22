import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { Role } from '@prisma/client';
import { NotificationsService } from './notifications.service';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';

class CreateAnnouncementDto {
  @IsString() title!: string;
  @IsString() body!: string;
}

@ApiTags('notifications')
@ApiBearerAuth()
@Controller()
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get('notifications')
  list(@CurrentUser('userId') userId: string) {
    return this.notifications.list(userId);
  }

  @Get('notifications/unread-count')
  unread(@CurrentUser('userId') userId: string) {
    return this.notifications.unreadCount(userId);
  }

  @Patch('notifications/read-all')
  readAll(@CurrentUser('userId') userId: string) {
    return this.notifications.markAllRead(userId);
  }

  @Patch('notifications/:id/read')
  read(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.notifications.markRead(userId, id);
  }

  @Get('announcements')
  listAnnouncements(@CurrentUser('companyId') companyId: string | null) {
    return this.notifications.listAnnouncements(companyId);
  }

  @Roles(Role.OWNER, Role.MANAGER, Role.HR)
  @Post('announcements')
  createAnnouncement(
    @CurrentUser('companyId') companyId: string | null,
    @Body() dto: CreateAnnouncementDto,
  ) {
    return this.notifications.createAnnouncement(companyId, dto.title, dto.body);
  }
}
