import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'nieuw@bedrijf.be' })
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: 'Jan' })
  @IsString()
  firstName!: string;

  @ApiProperty({ example: 'Jansen' })
  @IsString()
  lastName!: string;

  @ApiProperty({ example: 'Mijn Horecazaak' })
  @IsString()
  companyName!: string;
}
