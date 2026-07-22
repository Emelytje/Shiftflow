import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

/** Genereert een leesbaar tijdelijk wachtwoord. */
function tempPassword(): string {
  return `Sf-${randomBytes(4).toString('hex')}!`;
}

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

  /** Maakt een nieuwe medewerker aan en geeft een tijdelijk wachtwoord terug. */
  async createEmployee(companyId: string | null, dto: CreateEmployeeDto) {
    if (!companyId) {
      throw new ForbiddenException('Geen bedrijf gekoppeld aan account');
    }
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('E-mailadres is al in gebruik');
    }
    const password = tempPassword();
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await this.prisma.user.create({
      data: {
        companyId,
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role ?? Role.EMPLOYEE,
        employmentType: dto.employmentType,
        contractHoursPerWeek: dto.contractHoursPerWeek,
        hourlyCost: dto.hourlyCost,
        color: dto.color ?? '#0EA5E9',
      },
      select: publicUserSelect,
    });
    // Tijdelijk wachtwoord wordt eenmalig teruggegeven zodat de beheerder het kan delen.
    return { user, tempPassword: password };
  }

  async updateEmployee(companyId: string | null, id: string, dto: UpdateEmployeeDto) {
    if (!companyId) {
      throw new ForbiddenException('Geen bedrijf gekoppeld aan account');
    }
    const existing = await this.prisma.user.findFirst({ where: { id, companyId } });
    if (!existing) {
      throw new NotFoundException('Medewerker niet gevonden');
    }
    return this.prisma.user.update({
      where: { id },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        role: dto.role,
        employmentType: dto.employmentType,
        contractHoursPerWeek: dto.contractHoursPerWeek,
        hourlyCost: dto.hourlyCost,
        color: dto.color,
        isActive: dto.isActive,
      },
      select: publicUserSelect,
    });
  }
}
