import { Injectable } from '@nestjs/common';
import {
  StatusContrato,
  StatusLancamentoFinanceiro,
  TipoLancamentoFinanceiro,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard(empresaId: number) {
    const now = new Date();
    const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      usuarios,
      usuariosAtivos,
      imoveis,
      imoveisPublicados,
      leads,
      clientes,
      proprietarios,
      contratosAtivos,
      documentos,
      notificacoesNaoLidas,
      backups,
      integracoes,
      auditRecente,
      receitaMes,
    ] = await Promise.all([
      this.prisma.usuario.count({ where: { empresaId } }),
      this.prisma.usuario.count({ where: { empresaId, ativo: true } }),
      this.prisma.property.count({ where: { empresaId } }),
      this.prisma.property.count({
        where: { empresaId, publicado: true, ativo: true },
      }),
      this.prisma.lead.count({ where: { empresaId, ativo: true } }),
      this.prisma.cliente.count({ where: { empresaId, ativo: true } }),
      this.prisma.propertyOwner.count({ where: { empresaId, ativo: true } }),
      this.prisma.contrato.count({
        where: { empresaId, status: StatusContrato.ATIVO, ativo: true },
      }),
      this.prisma.documento.count({ where: { empresaId } }),
      this.prisma.appNotification.count({
        where: { empresaId, lida: false },
      }),
      this.prisma.backupRecord.count({ where: { empresaId } }),
      this.prisma.integrationConfig.count({
        where: { empresaId, ativo: true },
      }),
      this.prisma.auditLog.findMany({
        where: { empresaId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          user: { select: { id: true, nome: true } },
        },
      }),
      this.prisma.lancamentoFinanceiro.aggregate({
        where: {
          empresaId,
          tipo: TipoLancamentoFinanceiro.A_RECEBER,
          status: StatusLancamentoFinanceiro.LIQUIDADO,
          createdAt: { gte: inicioMes },
        },
        _sum: { valor: true },
      }),
    ]);

    return {
      resumo: {
        usuarios,
        usuariosAtivos,
        imoveis,
        imoveisPublicados,
        leads,
        clientes,
        proprietarios,
        contratosAtivos,
        documentos,
        notificacoesNaoLidas,
        backups,
        integracoesAtivas: integracoes,
        receitaMes: receitaMes._sum.valor || 0,
      },
      auditRecente,
    };
  }
}
