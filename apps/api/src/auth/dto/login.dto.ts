import { IsEmail, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'owner@demo.shiftflow.app' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Demo1234!' })
  @IsString()
  password!: string;

  @ApiPropertyOptional({ description: '6-cijferige 2FA-code (indien ingeschakeld)' })
  @IsOptional()
  @IsString()
  code?: string;
}
