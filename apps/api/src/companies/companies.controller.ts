import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('companies')
@ApiBearerAuth()
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get('me')
  getMyCompany(@CurrentUser('companyId') companyId: string | null) {
    return this.companiesService.getMyCompany(companyId);
  }
}
