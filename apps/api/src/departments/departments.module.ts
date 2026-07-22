import { Module } from '@nestjs/common';
import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsHexColor, IsOptional, IsString, IsUUID } from 'class-validator';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';

class CreateDepartmentDto {
  @IsString() name!: string;
  @IsOptional() @IsHexColor() color?: string;
  @IsOptional() @IsUUID() locationId?: string;
}
class UpdateDepartmentDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsHexColor() color?: string;
  @IsOptional() @IsUUID() locationId?: string;
}

@Injectable()
class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  private assert(companyId: string | null): asserts companyId is string {
    if (!companyId) throw new ForbiddenException('Geen bedrijf gekoppeld');
  }

  findAll(companyId: string | null) {
    this.assert(companyId);
    return this.prisma.department.findMany({
      where: { companyId },
      include: { location: { select: { id: true, name: true } }, _count: { select: { shifts: true } } },
      orderBy: { name: 'asc' },
    });
  }

  create(companyId: string | null, dto: CreateDepartmentDto) {
    this.assert(companyId);
    return this.prisma.department.create({
      data: { companyId, name: dto.name, color: dto.color ?? '#38BDF8', locationId: dto.locationId },
    });
  }

  async update(companyId: string | null, id: string, dto: UpdateDepartmentDto) {
    this.assert(companyId);
    const existing = await this.prisma.department.findFirst({ where: { id, companyId } });
    if (!existing) throw new NotFoundException('Afdeling niet gevonden');
    return this.prisma.department.update({
      where: { id },
      data: { name: dto.name, color: dto.color, locationId: dto.locationId },
    });
  }

  async remove(companyId: string | null, id: string) {
    this.assert(companyId);
    const existing = await this.prisma.department.findFirst({ where: { id, companyId } });
    if (!existing) throw new NotFoundException('Afdeling niet gevonden');
    await this.prisma.department.delete({ where: { id } });
    return { success: true };
  }
}

@ApiTags('departments')
@ApiBearerAuth()
@Controller('departments')
class DepartmentsController {
  constructor(private readonly service: DepartmentsService) {}

  @Get()
  findAll(@CurrentUser('companyId') companyId: string | null) {
    return this.service.findAll(companyId);
  }

  @Roles(Role.OWNER, Role.MANAGER)
  @Post()
  create(@CurrentUser('companyId') companyId: string | null, @Body() dto: CreateDepartmentDto) {
    return this.service.create(companyId, dto);
  }

  @Roles(Role.OWNER, Role.MANAGER)
  @Patch(':id')
  update(
    @CurrentUser('companyId') companyId: string | null,
    @Param('id') id: string,
    @Body() dto: UpdateDepartmentDto,
  ) {
    return this.service.update(companyId, id, dto);
  }

  @Roles(Role.OWNER, Role.MANAGER)
  @Delete(':id')
  remove(@CurrentUser('companyId') companyId: string | null, @Param('id') id: string) {
    return this.service.remove(companyId, id);
  }
}

@Module({
  controllers: [DepartmentsController],
  providers: [DepartmentsService],
})
export class DepartmentsModule {}
