import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  private assert(companyId: string | null): asserts companyId is string {
    if (!companyId) throw new ForbiddenException('Geen bedrijf gekoppeld');
  }

  private async assertParticipant(userId: string, conversationId: string) {
    const p = await this.prisma.conversationParticipant.findFirst({
      where: { conversationId, userId },
    });
    if (!p) throw new ForbiddenException('Geen deelnemer aan dit gesprek');
    return p;
  }

  /** Gesprekken van de gebruiker, met laatste bericht en deelnemers. */
  async listConversations(user: AuthUser) {
    this.assert(user.companyId);
    const parts = await this.prisma.conversationParticipant.findMany({
      where: { userId: user.userId },
      select: { conversationId: true },
    });
    const ids = parts.map((p) => p.conversationId);
    if (ids.length === 0) return [];

    const conversations = await this.prisma.conversation.findMany({
      where: { id: { in: ids } },
      include: {
        participants: true,
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    // Namen van deelnemers ophalen.
    const userIds = [
      ...new Set(conversations.flatMap((c) => c.participants.map((p) => p.userId))),
    ];
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, firstName: true, lastName: true, color: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    return conversations
      .map((c) => ({
        id: c.id,
        name: c.name,
        isGroup: c.isGroup,
        participants: c.participants
          .map((p) => userMap.get(p.userId))
          .filter(Boolean),
        lastMessage: c.messages[0]
          ? { body: c.messages[0].body, createdAt: c.messages[0].createdAt }
          : null,
      }))
      .sort((a, b) => {
        const ta = a.lastMessage?.createdAt?.getTime() ?? 0;
        const tb = b.lastMessage?.createdAt?.getTime() ?? 0;
        return tb - ta;
      });
  }

  /** Zoekt of maakt een 1-op-1 gesprek tussen de gebruiker en een collega. */
  async getOrCreateDirect(user: AuthUser, otherUserId: string) {
    this.assert(user.companyId);
    const other = await this.prisma.user.findFirst({
      where: { id: otherUserId, companyId: user.companyId },
    });
    if (!other) throw new NotFoundException('Collega niet gevonden');

    // Bestaand 1-op-1 gesprek zoeken.
    const mine = await this.prisma.conversationParticipant.findMany({
      where: { userId: user.userId, conversation: { isGroup: false, companyId: user.companyId } },
      select: { conversationId: true },
    });
    for (const { conversationId } of mine) {
      const parts = await this.prisma.conversationParticipant.findMany({
        where: { conversationId },
        select: { userId: true },
      });
      if (parts.length === 2 && parts.some((p) => p.userId === otherUserId)) {
        return { id: conversationId };
      }
    }

    const created = await this.prisma.conversation.create({
      data: {
        companyId: user.companyId,
        isGroup: false,
        participants: {
          create: [{ userId: user.userId }, { userId: otherUserId }],
        },
      },
    });
    return { id: created.id };
  }

  async createGroup(user: AuthUser, name: string, userIds: string[]) {
    this.assert(user.companyId);
    const unique = [...new Set([user.userId, ...userIds])];
    const created = await this.prisma.conversation.create({
      data: {
        companyId: user.companyId,
        name,
        isGroup: true,
        participants: { create: unique.map((id) => ({ userId: id })) },
      },
    });
    return { id: created.id };
  }

  async listMessages(user: AuthUser, conversationId: string) {
    await this.assertParticipant(user.userId, conversationId);
    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      include: { sender: { select: { id: true, firstName: true, lastName: true, color: true } } },
      orderBy: { createdAt: 'asc' },
      take: 200,
    });
    // Markeer als gelezen.
    await this.prisma.conversationParticipant.updateMany({
      where: { conversationId, userId: user.userId },
      data: { lastReadAt: new Date() },
    });
    return messages;
  }

  async sendMessage(user: AuthUser, conversationId: string, body: string) {
    await this.assertParticipant(user.userId, conversationId);
    return this.prisma.message.create({
      data: { conversationId, senderId: user.userId, body },
      include: { sender: { select: { id: true, firstName: true, lastName: true, color: true } } },
    });
  }
}
