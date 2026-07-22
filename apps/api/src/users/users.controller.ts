import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { UsersService } from './users.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(@CurrentUser('companyId') companyId: string | null) {
    return this.usersService.findAllForCompany(companyId);
  }

  @Get(':id')
  findOne(
    @CurrentUser('companyId') companyId: string | null,
    @Param('id') id: string,
  ) {
    return this.usersService.findOne(companyId, id);
  }

  @Roles(Role.OWNER, Role.HR)
  @Post()
  create(
    @CurrentUser('companyId') companyId: string | null,
    @Body() dto: CreateEmployeeDto,
  ) {
    return this.usersService.createEmployee(companyId, dto);
  }

  @Roles(Role.OWNER, Role.HR)
  @Patch(':id')
  update(
    @CurrentUser('companyId') companyId: string | null,
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeDto,
  ) {
    return this.usersService.updateEmployee(companyId, id, dto);
  }
}
