import { Injectable, NotImplementedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from '../auth/types/auth-user.type';

@Injectable()
export class BackupService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(empresaId: number) {
    return this.prisma.backupRecord.findMany({
      where: { empresaId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  createStub(_user: AuthUser): never {
    void _user;
    throw new NotImplementedException(
      'Backup não configurado neste ambiente. Configure um provedor de backup antes de usar este endpoint.',
    );
  }
}
