import {
  IsEmail,
  IsEnum,
  IsHexColor,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmploymentType, Role } from '@prisma/client';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'nieuwe.medewerker@bedrijf.be' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Sofie' })
  @IsString()
  firstName!: string;

  @ApiProperty({ example: 'Vermeulen' })
  @IsString()
  lastName!: string;

  @ApiPropertyOptional({ enum: Role, default: Role.EMPLOYEE })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({ enum: EmploymentType })
  @IsOptional()
  @IsEnum(EmploymentType)
  employmentType?: EmploymentType;

  @ApiPropertyOptional({ example: 24 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  contractHoursPerWeek?: number;

  @ApiPropertyOptional({ example: 18 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  hourlyCost?: number;

  @ApiPropertyOptional({ example: '#0EA5E9' })
  @IsOptional()
  @IsHexColor()
  color?: string;
}
