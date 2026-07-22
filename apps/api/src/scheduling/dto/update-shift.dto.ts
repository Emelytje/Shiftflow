import { PartialType } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { ShiftStatus } from '@prisma/client';
import { CreateShiftDto } from './create-shift.dto';

export class UpdateShiftDto extends PartialType(CreateShiftDto) {
  @IsOptional()
  @IsEnum(ShiftStatus)
  status?: ShiftStatus;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
