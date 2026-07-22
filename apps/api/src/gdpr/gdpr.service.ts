import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';

const CAN_MANAGE: Role[] = [Role.OWNER, Role.HR, Role.SUPER_ADMIN];

@Injectable()
export class GdprService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * GDPR art. 15 & 20 — recht op inzage en dataportabiliteit.
   * Exporteert alle persoonsgegevens van een gebruiker als JSON.
   */
  async exportData(user: AuthUser, targetUserId?: string) {
    const userId =
      targetUserId && CAN_MANAGE.includes(user.role as Role)
        ? targetUserId
        : user.userId;

    const record = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: { include: { location: true, department: true, team: true } },
        qualifications: { include: { qualification: true } },
        availabilities: true,
        shifts: true,
        leaveRequests: true,
        leaveBalances: true,
        timeEntries: true,
        documents: true,
        notifications: true,
      },
    });
    if (!record) throw new NotFoundException('Gebruiker niet gevonden');

    // Gevoelige/technische velden weglaten uit de export.
    const { passwordHash, twoFactorSecret, ...safe } = record;
    void passwordHash;
    void twoFactorSecret;

    return {
      exportedAt: new Date().toISOString(),
      subject: `${record.firstName} ${record.lastName}`,
      note: 'Persoonsgegevensexport conform GDPR art. 15 & 20.',
      data: safe,
    };
  }

  /**
   * GDPR art. 17 — recht op vergetelheid.
   * Anonimiseert de gebruiker (i.p.v. hard verwijderen) zodat gekoppelde
   * roosters/uren/audit hun integriteit behouden, maar geen persoon meer
   * identificeren.
   */
  async eraseUser(user: AuthUser, targetUserId: string) {
    const isSelf = user.userId === targetUserId;
    if (!isSelf && !CAN_MANAGE.includes(user.role as Role)) {
      throw new ForbiddenException('Geen rechten om deze gebruiker te wissen');
    }
    const target = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) throw new NotFoundException('Gebruiker niet gevonden');

    const anonEmail = `verwijderd+${target.id}@anoniem.local`;
    await this.prisma.$transaction([
      this.prisma.refreshToken.deleteMany({ where: { userId: targetUserId } }),
      this.prisma.oAuthAccount.deleteMany({ where: { userId: targetUserId } }),
      this.prisma.availability.deleteMany({ where: { userId: targetUserId } }),
      this.prisma.user.update({
        where: { id: targetUserId },
        data: {
          email: anonEmail,
          firstName: 'Verwijderd',
          lastName: 'Gebruiker',
          phone: null,
          avatarUrl: null,
          passwordHash: null,
          twoFactorEnabled: false,
          twoFactorSecret: null,
          hourlyCost: null,
          isActive: false,
        },
      }),
    ]);

    return { erased: true, userId: targetUserId };
  }
}
