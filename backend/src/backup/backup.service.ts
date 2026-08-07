import { Injectable } from '@nestjs/common';
import { BackupStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { AuthUser } from '../auth/types/auth-user.type';

@Injectable()
export class BackupService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  findAll(empresaId: number) {
    return this.prisma.backupRecord.findMany({
      where: { empresaId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async createStub(user: AuthUser) {
    const record = await this.prisma.backupRecord.create({
      data: {
        empresaId: user.empresaId,
        status: BackupStatus.PENDENTE,
        filePath: null,
      },
    });

    // Stub: mark as completed shortly with a placeholder path
    const completed = await this.prisma.backupRecord.update({
      where: { id: record.id },
      data: {
        status: BackupStatus.CONCLUIDO,
        filePath: `/backups/stub-${user.empresaId}-${record.id}.json`,
        completedAt: new Date(),
      },
    });

    await this.auditService.logAudit(
      user,
      'CREATE',
      'BackupRecord',
      completed.id,
    );

    return completed;
  }
}
