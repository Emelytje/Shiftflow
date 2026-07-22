import { ForbiddenException, Injectable } from '@nestjs/common';
import { NotificationChannel } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Interne helper: stuurt een in-app melding naar één gebruiker. */
  async notify(userId: string, title: string, body: string, linkUrl?: string) {
    try {
      await this.prisma.notification.create({
        data: { userId, channel: NotificationChannel.IN_APP, title, body, linkUrl },
      });
    } catch {
      // Notificaties mogen de hoofdactie nooit doen falen.
    }
  }

  list(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async unreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, readAt: null },
    });
    return { count };
  }

  async markRead(userId: string, id: string) {
    await this.prisma.notification.updateMany({
      where: { id, userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { success: true };
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { success: true };
  }

  // ── Aankondigingen ──
  listAnnouncements(companyId: string | null) {
    if (!companyId) throw new ForbiddenException('Geen bedrijf gekoppeld');
    return this.prisma.announcement.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  /** Maakt een aankondiging én stuurt iedereen in het bedrijf een melding. */
  async createAnnouncement(companyId: string | null, title: string, body: string) {
    if (!companyId) throw new ForbiddenException('Geen bedrijf gekoppeld');
    const announcement = await this.prisma.announcement.create({
      data: { companyId, title, body },
    });
    const users = await this.prisma.user.findMany({
      where: { companyId, isActive: true },
      select: { id: true },
    });
    await this.prisma.notification.createMany({
      data: users.map((u) => ({
        userId: u.id,
        channel: NotificationChannel.IN_APP,
        title: `📢 ${title}`,
        body,
      })),
    });
    return announcement;
  }
}
