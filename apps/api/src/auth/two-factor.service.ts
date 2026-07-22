import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';
import { encrypt, decrypt } from '../common/crypto.util';

@Injectable()
export class TwoFactorService {
  constructor(private readonly prisma: PrismaService) {}

  /** Genereert een nieuw secret + QR-code. Nog niet geactiveerd. */
  async setup(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException();

    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(user.email, 'ShiftFlow', secret);
    const qrDataUrl = await QRCode.toDataURL(otpauth);

    // Secret versleuteld opslaan (at rest), nog niet ingeschakeld.
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: encrypt(secret) },
    });

    return { secret, otpauth, qrDataUrl };
  }

  /** Verifieert een code tegen het opgeslagen (versleutelde) secret. */
  async verifyCode(userId: string, code: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.twoFactorSecret) return false;
    const secret = decrypt(user.twoFactorSecret);
    return authenticator.verify({ token: code, secret });
  }

  async enable(userId: string, code: string) {
    const ok = await this.verifyCode(userId, code);
    if (!ok) throw new BadRequestException('Ongeldige verificatiecode');
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });
    return { enabled: true };
  }

  async disable(userId: string, code: string) {
    const ok = await this.verifyCode(userId, code);
    if (!ok) throw new BadRequestException('Ongeldige verificatiecode');
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false, twoFactorSecret: null },
    });
    return { enabled: false };
  }
}
