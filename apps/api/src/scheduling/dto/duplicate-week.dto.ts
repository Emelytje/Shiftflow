import { IsDateString, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DuplicateWeekDto {
  @ApiProperty({ example: '2026-07-20T00:00:00.000Z', description: 'Maandag van de bronweek' })
  @IsDateString()
  sourceWeekStart!: string;

  @ApiProperty({ example: '2026-07-27T00:00:00.000Z', description: 'Maandag van de doelweek' })
  @IsDateString()
  targetWeekStart!: string;

  @ApiPropertyOptional({ description: 'Neem de toegewezen medewerkers mee (standaard true)' })
  @IsOptional()
  @IsBoolean()
  keepAssignees?: boolean;
}
