import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(empresaId: number) {
    const [
      totalImoveis,
      imoveisDisponiveis,
      totalLeads,
      totalUsuarios,
      leadsRecentes,
      imoveisRecentes,
      leadsPorStatus,
      imoveisPorFinalidade,
    ] = await Promise.all([
      this.prisma.property.count({
        where: { empresaId },
      }),

      this.prisma.property.count({
        where: {
          empresaId,
          ativo: true,
          publicado: true,
        },
      }),

      this.prisma.lead.count({
        where: {
          empresaId,
          ativo: true,
        },
      }),

      this.prisma.usuario.count({
        where: {
          empresaId,
          ativo: true,
        },
      }),

      this.prisma.lead.findMany({
        where: {
          empresaId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
        include: {
          assignedUser: true,
          stage: true,
        },
      }),

      this.prisma.property.findMany({
        where: {
          empresaId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      }),

      this.prisma.lead.groupBy({
        by: ['status'],
        where: {
          empresaId,
        },
        _count: true,
      }),

      this.prisma.property.groupBy({
        by: ['finalidade'],
        where: {
          empresaId,
        },
        _count: true,
      }),
    ]);

    return {
      resumo: {
        totalImoveis,
        imoveisDisponiveis,
        totalClientes: totalLeads,
        totalProprietarios: 0,
        totalCorretores: totalUsuarios,
        leadsAtivos: totalLeads,
        contratosAtivos: 0,
        receitaMes: 0,
        aReceber: 0,
        aPagar: 0,
        comissoesPendentes: 0,
        cobrancasPendentes: 0,
        cobrancasAtrasadas: 0,
        tarefasPendentes: 0,
      },

      leadsPorStatus,

      imoveisPorStatus: imoveisPorFinalidade.map((item) => ({
        status: item.finalidade,
        _count: item._count,
      })),

      leadsRecentes: leadsRecentes.map((lead) => ({
        id: lead.id,
        titulo: lead.nome,
        status: lead.status,
        etapa: lead.stage,
        corretor: lead.assignedUser,
        cliente: {
          nome: lead.nome,
        },
      })),

      cobrancasProximas: [],

      imoveisRecentes,
    };
  }
}
