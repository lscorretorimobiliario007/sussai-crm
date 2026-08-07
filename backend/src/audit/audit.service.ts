import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from '../auth/types/auth-user.type';

export type AuditMeta = Prisma.InputJsonValue | null | undefined;

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async logAudit(
    user: Pick<AuthUser, 'id' | 'empresaId'> | null | undefined,
    action: string,
    entity: string,
    entityId?: string | number | null,
    meta?: AuditMeta,
    ip?: string | null,
  ) {
    return this.prisma.auditLog.create({
      data: {
        empresaId: user?.empresaId ?? null,
        userId: user?.id ?? null,
        action,
        entity,
        entityId: entityId == null ? null : String(entityId),
        meta: meta === undefined ? undefined : (meta as Prisma.InputJsonValue),
        ip: ip ?? null,
      },
    });
  }

  async findAll(
    empresaId: number,
    opts: {
      page?: number;
      limit?: number;
      entity?: string;
      action?: string;
    } = {},
  ) {
    const page = opts.page ?? 1;
    const limit = Math.min(opts.limit ?? 20, 100);
    const where: Prisma.AuditLogWhereInput = {
      empresaId,
      ...(opts.entity ? { entity: opts.entity } : {}),
      ...(opts.action
        ? { action: { contains: opts.action, mode: 'insensitive' } }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { id: true, nome: true, email: true } },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }
}
