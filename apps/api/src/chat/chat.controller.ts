import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';
import { ChatService } from './chat.service';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';

class DirectDto {
  @IsString() userId!: string;
}
class GroupDto {
  @IsString() name!: string;
  @IsArray() @ArrayNotEmpty() userIds!: string[];
}
class MessageDto {
  @IsString() body!: string;
}

@ApiTags('chat')
@ApiBearerAuth()
@Controller('conversations')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.chat.listConversations(user);
  }

  @Post('direct')
  direct(@CurrentUser() user: AuthUser, @Body() dto: DirectDto) {
    return this.chat.getOrCreateDirect(user, dto.userId);
  }

  @Post('group')
  group(@CurrentUser() user: AuthUser, @Body() dto: GroupDto) {
    return this.chat.createGroup(user, dto.name, dto.userIds);
  }

  @Get(':id/messages')
  messages(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.chat.listMessages(user, id);
  }

  @Post(':id/messages')
  send(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: MessageDto,
  ) {
    return this.chat.sendMessage(user, id, dto.body);
  }
}
