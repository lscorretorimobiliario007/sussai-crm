import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from '../auth/types/auth-user.type';

@Injectable()
export class NotificacoesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(user: AuthUser) {
    return this.prisma.appNotification.findMany({
      where: {
        empresaId: user.empresaId,
        OR: [{ userId: user.id }, { userId: null }],
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async markRead(user: AuthUser, id: number) {
    const item = await this.prisma.appNotification.findFirst({
      where: {
        id,
        empresaId: user.empresaId,
        OR: [{ userId: user.id }, { userId: null }],
      },
    });
    if (!item) {
      throw new NotFoundException('Notificação não encontrada');
    }
    return this.prisma.appNotification.update({
      where: { id },
      data: { lida: true },
    });
  }

  async markAllRead(user: AuthUser) {
    await this.prisma.appNotification.updateMany({
      where: {
        empresaId: user.empresaId,
        lida: false,
        OR: [{ userId: user.id }, { userId: null }],
      },
      data: { lida: true },
    });
    return { ok: true };
  }
}
