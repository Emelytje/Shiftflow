import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';
import { Role } from '@prisma/client';
import { AiService } from './ai.service';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';

class AutoPlanDto {
  @IsDateString()
  weekStart!: string;
}

@ApiTags('ai')
@ApiBearerAuth()
@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Roles(Role.OWNER, Role.MANAGER, Role.TEAM_LEAD)
  @Post('auto-plan')
  autoPlan(@CurrentUser() user: AuthUser, @Body() dto: AutoPlanDto) {
    return this.ai.autoPlan(user, dto.weekStart);
  }
}
