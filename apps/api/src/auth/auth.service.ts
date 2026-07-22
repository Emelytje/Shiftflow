import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './jwt.strategy';
import { TwoFactorService } from './two-factor.service';

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // verwijder accenten
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40);
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly twoFactor: TwoFactorService,
  ) {}

  /** Registreert een nieuw bedrijf + eigenaar-account. */
  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('E-mailadres is al in gebruik');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    let slug = slugify(dto.companyName) || 'bedrijf';
    // Zorg voor een unieke slug.
    if (await this.prisma.company.findUnique({ where: { slug } })) {
      slug = `${slug}-${randomBytes(3).toString('hex')}`;
    }

    const company = await this.prisma.company.create({
      data: {
        name: dto.companyName,
        slug,
        subscription: { create: {} },
        users: {
          create: {
            email: dto.email,
            passwordHash,
            firstName: dto.firstName,
            lastName: dto.lastName,
            role: Role.OWNER,
          },
        },
      },
      include: { users: true },
    });

    const user = company.users[0];
    return this.issueTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: company.id,
    });
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Ongeldige inloggegevens');
    }
    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid || !user.isActive) {
      throw new UnauthorizedException('Ongeldige inloggegevens');
    }

    // Tweestapsverificatie (indien ingeschakeld).
    if (user.twoFactorEnabled) {
      if (!dto.code) {
        throw new UnauthorizedException({
          message: '2FA-code vereist',
          twoFactorRequired: true,
        });
      }
      const ok = await this.twoFactor.verifyCode(user.id, dto.code);
      if (!ok) {
        throw new UnauthorizedException('Ongeldige 2FA-code');
      }
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.issueTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    });
  }

  async refresh(refreshToken: string) {
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Ongeldige of verlopen sessie');
    }
    // Roteer: oude token intrekken.
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });
    return this.issueTokens({
      sub: stored.user.id,
      email: stored.user.email,
      role: stored.user.role,
      companyId: stored.user.companyId,
    });
  }

  async logout(refreshToken: string) {
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { success: true };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatarUrl: true,
        color: true,
        companyId: true,
        twoFactorEnabled: true,
        company: { select: { id: true, name: true, slug: true, logoUrl: true } },
      },
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }

  private async issueTokens(payload: JwtPayload) {
    const accessToken = await this.jwt.signAsync(payload, {
      secret:
        process.env.JWT_ACCESS_SECRET ??
        'change-me-access-secret-min-32-chars-long',
      expiresIn: Number(process.env.JWT_ACCESS_TTL ?? 900),
    });

    const refreshToken = randomBytes(48).toString('hex');
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
    const ttl = Number(process.env.JWT_REFRESH_TTL ?? 1_209_600);
    await this.prisma.refreshToken.create({
      data: {
        userId: payload.sub,
        tokenHash,
        expiresAt: new Date(Date.now() + ttl * 1000),
      },
    });

    return { accessToken, refreshToken };
  }
}
