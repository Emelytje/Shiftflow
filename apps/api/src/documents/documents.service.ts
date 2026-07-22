import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DocumentType, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';

const MANAGER_ROLES: Role[] = [Role.OWNER, Role.MANAGER, Role.HR];

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  private assert(companyId: string | null): asserts companyId is string {
    if (!companyId) throw new ForbiddenException('Geen bedrijf gekoppeld');
  }

  private canManage(role: string): boolean {
    return MANAGER_ROLES.includes(role as Role);
  }

  /** Lijst: beheerders zien alles, werknemers zien hun eigen + bedrijfsbrede docs. */
  list(user: AuthUser) {
    this.assert(user.companyId);
    const where: Prisma.DocumentWhereInput = { companyId: user.companyId };
    if (!this.canManage(user.role)) {
      where.OR = [{ userId: user.userId }, { userId: null }];
    }
    return this.prisma.document.findMany({
      where,
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Documenten die binnen 30 dagen vervallen (voor waarschuwingen). */
  expiring(user: AuthUser) {
    this.assert(user.companyId);
    const in30 = new Date();
    in30.setDate(in30.getDate() + 30);
    return this.prisma.document.findMany({
      where: {
        companyId: user.companyId,
        expiresAt: { not: null, lte: in30 },
      },
      include: { user: { select: { firstName: true, lastName: true } } },
      orderBy: { expiresAt: 'asc' },
    });
  }

  create(
    user: AuthUser,
    data: {
      type: DocumentType;
      name: string;
      storageKey: string;
      mimeType?: string;
      sizeBytes?: number;
      userId?: string;
      expiresAt?: string;
    },
  ) {
    this.assert(user.companyId);
    if (!this.canManage(user.role)) {
      throw new ForbiddenException('Geen rechten om documenten te uploaden');
    }
    return this.prisma.document.create({
      data: {
        companyId: user.companyId,
        userId: data.userId || null,
        type: data.type,
        name: data.name,
        storageKey: data.storageKey,
        mimeType: data.mimeType,
        sizeBytes: data.sizeBytes,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
    });
  }

  async findForDownload(user: AuthUser, id: string) {
    this.assert(user.companyId);
    const doc = await this.prisma.document.findFirst({
      where: { id, companyId: user.companyId },
    });
    if (!doc) throw new NotFoundException('Document niet gevonden');
    // Werknemer mag enkel eigen of bedrijfsbrede documenten downloaden.
    if (!this.canManage(user.role) && doc.userId && doc.userId !== user.userId) {
      throw new ForbiddenException('Geen toegang tot dit document');
    }
    return doc;
  }

  async remove(user: AuthUser, id: string) {
    this.assert(user.companyId);
    if (!this.canManage(user.role)) {
      throw new ForbiddenException('Geen rechten om documenten te verwijderen');
    }
    const doc = await this.prisma.document.findFirst({
      where: { id, companyId: user.companyId },
    });
    if (!doc) throw new NotFoundException('Document niet gevonden');
    await this.prisma.document.delete({ where: { id } });
    return { success: true, storageKey: doc.storageKey };
  }
}
