import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { AuthUser } from '../auth/types/auth-user.type';
import { CreateIntegracaoDto } from './dto/create-integracao.dto';

@Injectable()
export class IntegracoesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  findAll(empresaId: number) {
    return this.prisma.integrationConfig.findMany({
      where: { empresaId },
      orderBy: { provider: 'asc' },
    });
  }

  async upsert(user: AuthUser, dto: CreateIntegracaoDto) {
    const provider = dto.provider.trim().toLowerCase();
    const item = await this.prisma.integrationConfig.upsert({
      where: {
        empresaId_provider: {
          empresaId: user.empresaId,
          provider,
        },
      },
      create: {
        empresaId: user.empresaId,
        provider,
        config: dto.config as Prisma.InputJsonValue,
        ativo: dto.ativo ?? true,
      },
      update: {
        config: dto.config as Prisma.InputJsonValue,
        ...(dto.ativo !== undefined && { ativo: dto.ativo }),
      },
    });

    await this.auditService.logAudit(
      user,
      'UPSERT',
      'IntegrationConfig',
      item.id,
      {
        provider,
      },
    );

    return item;
  }
}
