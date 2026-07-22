import { Body, Controller, Get, Post, HttpCode } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { IsString } from 'class-validator';
import { AuthService } from './auth.service';
import { TwoFactorService } from './two-factor.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

class TwoFactorCodeDto {
  @IsString()
  code!: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly twoFactor: TwoFactorService,
  ) {}

  // Strengere limiet tegen brute force: 5 pogingen per minuut.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Public()
  @HttpCode(200)
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @HttpCode(200)
  @Post('refresh')
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Public()
  @HttpCode(200)
  @Post('logout')
  logout(@Body() dto: RefreshDto) {
    return this.authService.logout(dto.refreshToken);
  }

  @ApiBearerAuth()
  @Get('me')
  me(@CurrentUser('userId') userId: string) {
    return this.authService.me(userId);
  }

  // ── Tweestapsverificatie ──
  @ApiBearerAuth()
  @Post('2fa/setup')
  setup2fa(@CurrentUser('userId') userId: string) {
    return this.twoFactor.setup(userId);
  }

  @ApiBearerAuth()
  @HttpCode(200)
  @Post('2fa/enable')
  enable2fa(@CurrentUser('userId') userId: string, @Body() dto: TwoFactorCodeDto) {
    return this.twoFactor.enable(userId, dto.code);
  }

  @ApiBearerAuth()
  @HttpCode(200)
  @Post('2fa/disable')
  disable2fa(@CurrentUser('userId') userId: string, @Body() dto: TwoFactorCodeDto) {
    return this.twoFactor.disable(userId, dto.code);
  }
}
