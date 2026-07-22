import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const publicUserSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  color: true,
  avatarUrl: true,
  employmentType: true,
  contractHoursPerWeek: true,
  isActive: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /** Alle medewerkers binnen het eigen bedrijf (tenant-scoped). */
  findAllForCompany(companyId: string | null) {
    if (!companyId) {
      throw new ForbiddenException('Geen bedrijf gekoppeld aan account');
    }
    return this.prisma.user.findMany({
      where: { companyId },
      select: publicUserSelect,
      orderBy: [{ isActive: 'desc' }, { firstName: 'asc' }],
    });
  }

  async findOne(companyId: string | null, id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, companyId: companyId ?? undefined },
      select: publicUserSelect,
    });
    if (!user) {
      throw new NotFoundException('Medewerker niet gevonden');
    }
    return user;
  }
}
