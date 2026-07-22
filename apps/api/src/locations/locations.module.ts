import { Module } from '@nestjs/common';
import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';

class CreateLocationDto {
  @IsString() name!: string;
  @IsOptional() @IsString() address?: string;
}
class UpdateLocationDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() address?: string;
}

@Injectable()
class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  private assert(companyId: string | null): asserts companyId is string {
    if (!companyId) throw new ForbiddenException('Geen bedrijf gekoppeld');
  }

  findAll(companyId: string | null) {
    this.assert(companyId);
    return this.prisma.location.findMany({
      where: { companyId },
      include: { _count: { select: { departments: true, shifts: true } } },
      orderBy: { name: 'asc' },
    });
  }

  create(companyId: string | null, dto: CreateLocationDto) {
    this.assert(companyId);
    return this.prisma.location.create({
      data: { companyId, name: dto.name, address: dto.address },
    });
  }

  async update(companyId: string | null, id: string, dto: UpdateLocationDto) {
    this.assert(companyId);
    const existing = await this.prisma.location.findFirst({ where: { id, companyId } });
    if (!existing) throw new NotFoundException('Vestiging niet gevonden');
    return this.prisma.location.update({
      where: { id },
      data: { name: dto.name, address: dto.address },
    });
  }

  async remove(companyId: string | null, id: string) {
    this.assert(companyId);
    const existing = await this.prisma.location.findFirst({ where: { id, companyId } });
    if (!existing) throw new NotFoundException('Vestiging niet gevonden');
    await this.prisma.location.delete({ where: { id } });
    return { success: true };
  }
}

@ApiTags('locations')
@ApiBearerAuth()
@Controller('locations')
class LocationsController {
  constructor(private readonly service: LocationsService) {}

  @Get()
  findAll(@CurrentUser('companyId') companyId: string | null) {
    return this.service.findAll(companyId);
  }

  @Roles(Role.OWNER, Role.MANAGER)
  @Post()
  create(@CurrentUser('companyId') companyId: string | null, @Body() dto: CreateLocationDto) {
    return this.service.create(companyId, dto);
  }

  @Roles(Role.OWNER, Role.MANAGER)
  @Patch(':id')
  update(
    @CurrentUser('companyId') companyId: string | null,
    @Param('id') id: string,
    @Body() dto: UpdateLocationDto,
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
  controllers: [LocationsController],
  providers: [LocationsService],
})
export class LocationsModule {}
