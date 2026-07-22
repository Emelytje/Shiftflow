import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LeaveType } from '@prisma/client';

export class CreateLeaveDto {
  @ApiProperty({ enum: LeaveType, example: LeaveType.VACATION })
  @IsEnum(LeaveType)
  type!: LeaveType;

  @ApiProperty({ example: '2026-08-10T00:00:00.000Z' })
  @IsDateString()
  startsAt!: string;

  @ApiProperty({ example: '2026-08-14T00:00:00.000Z' })
  @IsDateString()
  endsAt!: string;

  @ApiPropertyOptional({ example: 'Weekje vakantie' })
  @IsOptional()
  @IsString()
  reason?: string;
}
