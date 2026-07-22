import {
  IsDateString,
  IsHexColor,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateShiftDto {
  @ApiPropertyOptional({ example: 'Bar shift' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ example: '2026-07-23T09:00:00.000Z' })
  @IsDateString()
  startsAt!: string;

  @ApiProperty({ example: '2026-07-23T17:00:00.000Z' })
  @IsDateString()
  endsAt!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  locationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(480)
  breakMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: '#38BDF8' })
  @IsOptional()
  @IsHexColor()
  color?: string;
}
