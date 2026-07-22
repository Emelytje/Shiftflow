import { IsEnum, IsNumber, IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ClockMethod } from '@prisma/client';

export class ClockInDto {
  @ApiPropertyOptional({ enum: ClockMethod })
  @IsOptional()
  @IsEnum(ClockMethod)
  method?: ClockMethod;

  @ApiPropertyOptional({ description: 'Optioneel gekoppelde shift' })
  @IsOptional()
  @IsUUID()
  shiftId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  longitude?: number;
}

export class ClockOutDto {
  @ApiPropertyOptional({ description: 'Pauzeduur in minuten' })
  @IsOptional()
  @IsNumber()
  breakMinutes?: number;
}
