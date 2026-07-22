import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

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
}
