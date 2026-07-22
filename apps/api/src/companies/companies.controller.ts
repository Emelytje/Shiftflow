import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CompaniesService } from './companies.service';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('companies')
@ApiBearerAuth()
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get('me')
  getMyCompany(@CurrentUser('companyId') companyId: string | null) {
    return this.companiesService.getMyCompany(companyId);
  }

  @Roles(Role.OWNER)
  @Patch('me')
  update(
    @CurrentUser('companyId') companyId: string | null,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.companiesService.update(companyId, dto);
  }
}
