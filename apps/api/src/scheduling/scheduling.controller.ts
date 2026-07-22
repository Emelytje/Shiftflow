import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { SchedulingService } from './scheduling.service';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { QueryShiftsDto } from './dto/query-shifts.dto';
import { DuplicateWeekDto } from './dto/duplicate-week.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('scheduling')
@ApiBearerAuth()
@Controller('shifts')
export class SchedulingController {
  constructor(private readonly scheduling: SchedulingService) {}

  @Get()
  findAll(
    @CurrentUser('companyId') companyId: string | null,
    @Query() query: QueryShiftsDto,
  ) {
    return this.scheduling.findAll(companyId, query);
  }

  @Get(':id')
  findOne(
    @CurrentUser('companyId') companyId: string | null,
    @Param('id') id: string,
  ) {
    return this.scheduling.findOne(companyId, id);
  }

  @Roles(Role.OWNER, Role.MANAGER, Role.TEAM_LEAD)
  @Post()
  create(
    @CurrentUser('companyId') companyId: string | null,
    @Body() dto: CreateShiftDto,
    @Query('force') force?: string,
  ) {
    return this.scheduling.create(companyId, dto, force === 'true');
  }

  @Roles(Role.OWNER, Role.MANAGER, Role.TEAM_LEAD)
  @Post('duplicate-week')
  duplicateWeek(
    @CurrentUser('companyId') companyId: string | null,
    @Body() dto: DuplicateWeekDto,
  ) {
    return this.scheduling.duplicateWeek(companyId, dto);
  }

  @Roles(Role.OWNER, Role.MANAGER, Role.TEAM_LEAD)
  @Post('publish')
  publish(
    @CurrentUser('companyId') companyId: string | null,
    @Body() body: { from: string; to: string },
  ) {
    return this.scheduling.publishRange(companyId, body.from, body.to);
  }

  @Roles(Role.OWNER, Role.MANAGER, Role.TEAM_LEAD)
  @Patch(':id')
  update(
    @CurrentUser('companyId') companyId: string | null,
    @Param('id') id: string,
    @Body() dto: UpdateShiftDto,
    @Query('force') force?: string,
  ) {
    return this.scheduling.update(companyId, id, dto, force === 'true');
  }

  @Roles(Role.OWNER, Role.MANAGER, Role.TEAM_LEAD)
  @Delete(':id')
  remove(
    @CurrentUser('companyId') companyId: string | null,
    @Param('id') id: string,
  ) {
    return this.scheduling.remove(companyId, id);
  }
}
