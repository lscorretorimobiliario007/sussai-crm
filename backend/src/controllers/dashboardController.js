import prisma from "../config/prisma.js";
import { atualizarCobrancasAtrasadas } from "../utils/financeiro.js";
import { empresaScope } from "../utils/helpers.js";
import { atualizarLancamentosAtrasados } from "../services/financeiroDefaults.js";

export async function dashboard(req, res) {
  try {
    const scope = empresaScope(req);
    const isCorretor = req.usuario.tipo === "CORRETOR";
    const corretorScope = isCorretor ? { ...scope, corretorId: req.usuario.id } : scope;
    const tarefaScope = isCorretor ? { ...scope, usuarioId: req.usuario.id } : scope;
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    if (!isCorretor) {
      await Promise.all([
        atualizarCobrancasAtrasadas(prisma, scope.empresaId),
        atualizarLancamentosAtrasados(scope.empresaId),
      ]);
    }

    const [
      totalImoveis,
      imoveisDisponiveis,
      totalClientes,
      totalProprietarios,
      totalCorretores,
      leadsAtivos,
      contratosAtivos,
      cobrancasPendentes,
      cobrancasAtrasadas,
      receitaMes,
      leadsPorStatus,
      imoveisPorStatus,
      tarefasPendentes,
    ] = await Promise.all([
      prisma.imovel.count({ where: { ...corretorScope, ativo: true } }),
      prisma.imovel.count({ where: { ...corretorScope, status: "DISPONIVEL", ativo: true } }),
      prisma.cliente.count({ where: { ...corretorScope, ativo: true, tipo: { not: "PROPRIETARIO" } } }),
      prisma.cliente.count({ where: { ...corretorScope, ativo: true, tipo: "PROPRIETARIO" } }),
      prisma.usuario.count({
        where: {
          ...scope,
          ativo: true,
          tipo: { in: ["CORRETOR", "GERENTE", "ADMIN"] },
          statusCorretor: { not: "INATIVO" },
          ...(isCorretor ? { id: req.usuario.id } : {}),
        },
      }),
      prisma.lead.count({
        where: {
          ...corretorScope,
          ativo: true,
          status: { notIn: ["FECHADO", "PERDIDO"] },
        },
      }),
      prisma.contrato.count({ where: { ...corretorScope, status: "ATIVO" } }),
      isCorretor ? Promise.resolve(0) : prisma.cobranca.count({ where: { ...scope, status: "PENDENTE" } }),
      isCorretor ? Promise.resolve(0) : prisma.cobranca.count({ where: { ...scope, status: "ATRASADO" } }),
      isCorretor ? Promise.resolve({ _sum: { valor: 0 } }) : prisma.cobranca.aggregate({
        where: {
          ...scope,
          status: "PAGO",
          pagamento: { gte: inicioMes },
        },
        _sum: { valor: true },
      }),
      prisma.lead.groupBy({
        by: ["status"],
        where: { ...corretorScope, ativo: true },
        _count: true,
      }),
      prisma.imovel.groupBy({
        by: ["status"],
        where: { ...corretorScope, ativo: true },
        _count: true,
      }),
      prisma.tarefa.count({
        where: { ...tarefaScope, status: { in: ["PENDENTE", "EM_ANDAMENTO"] } },
      }),
    ]);

    const leadsRecentes = await prisma.lead.findMany({
      where: { ...corretorScope, ativo: true },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        cliente: { select: { nome: true, empresaId: true } },
        corretor: { select: { nome: true, empresaId: true } },
        etapa: { select: { id: true, nome: true, cor: true } },
      },
    });

    const cobrancasProximas = isCorretor ? [] : await prisma.cobranca.findMany({
      where: {
        ...scope,
        status: { in: ["PENDENTE", "ATRASADO"] },
      },
      orderBy: { vencimento: "asc" },
      take: 5,
      include: {
        contrato: {
          select: {
            numero: true,
            empresaId: true,
            cliente: { select: { nome: true, empresaId: true } },
          },
        },
      },
    });

    const openStatuses = ["ABERTO", "PARCIAL", "ATRASADO"];
    const [aReceberAgg, aPagarAgg, comissoesPendentesAgg] = isCorretor
      ? [{ _sum: { valor: 0 } }, { _sum: { valor: 0 } }, { _sum: { valor: 0 } }]
      : await Promise.all([
        prisma.lancamentoFinanceiro.aggregate({
          where: { ...scope, ativo: true, tipo: "A_RECEBER", status: { in: openStatuses } },
          _sum: { valor: true },
        }),
        prisma.lancamentoFinanceiro.aggregate({
          where: { ...scope, ativo: true, tipo: "A_PAGAR", status: { in: openStatuses } },
          _sum: { valor: true },
        }),
        prisma.comissao.aggregate({
          where: { ...scope, ativo: true, status: { in: ["PREVISTA", "APROVADA"] } },
          _sum: { valor: true },
        }),
      ]);

    return res.json({
      resumo: {
        totalImoveis,
        imoveisDisponiveis,
        totalClientes,
        totalProprietarios,
        totalCorretores,
        leadsAtivos,
        contratosAtivos,
        cobrancasPendentes,
        cobrancasAtrasadas,
        receitaMes: receitaMes._sum.valor || 0,
        tarefasPendentes,
        aReceber: aReceberAgg._sum.valor || 0,
        aPagar: aPagarAgg._sum.valor || 0,
        comissoesPendentes: comissoesPendentesAgg._sum.valor || 0,
      },
      leadsPorStatus,
      imoveisPorStatus,
      leadsRecentes: leadsRecentes.map((lead) => ({
        ...lead,
        cliente: lead.cliente?.empresaId === scope.empresaId ? { nome: lead.cliente.nome } : null,
        corretor: lead.corretor?.empresaId === scope.empresaId ? { nome: lead.corretor.nome } : null,
      })),
      cobrancasProximas: cobrancasProximas.map((cobranca) => ({
        ...cobranca,
        contrato: cobranca.contrato?.empresaId === scope.empresaId
          ? {
              numero: cobranca.contrato.numero,
              cliente: cobranca.contrato.cliente?.empresaId === scope.empresaId
                ? { nome: cobranca.contrato.cliente.nome }
                : null,
            }
          : null,
      })),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: "Erro ao carregar dashboard" });
  }
}
