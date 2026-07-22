import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyCompany(companyId: string | null) {
    if (!companyId) {
      throw new ForbiddenException('Geen bedrijf gekoppeld aan account');
    }
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: {
        subscription: true,
        locations: true,
        departments: true,
        _count: { select: { users: true, shifts: true } },
      },
    });
    if (!company) {
      throw new NotFoundException('Bedrijf niet gevonden');
    }
    return company;
  }
}
