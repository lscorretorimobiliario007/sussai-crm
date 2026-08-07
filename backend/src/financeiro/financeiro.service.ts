import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  FormaPagamentoFinanceiro,
  StatusCaixaDiario,
  StatusCobranca,
  StatusComissao,
  StatusConciliacao,
  StatusContrato,
  StatusLancamentoFinanceiro,
  TipoCliente,
  TipoContrato,
  TipoLancamentoFinanceiro,
  TipoMovimentoCaixa,
  UserProfile,
  type Cobranca,
  type Contrato,
  type Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from '../auth/types/auth-user.type';
import {
  atualizarCobrancasAtrasadas,
  atualizarLancamentosAtrasados,
  contratoNumero,
  ensureCatalogoPadrao,
  monthRange,
  startOfDay,
} from './financeiro.defaults';
import { CreateLancamentoDto } from './dto/create-lancamento.dto';
import { LiquidarLancamentoDto } from './dto/liquidar-lancamento.dto';
import { QueryLancamentoDto } from './dto/query-lancamento.dto';
import { CreateCobrancaDto } from './dto/create-cobranca.dto';
import { PagarCobrancaDto } from './dto/pagar-cobranca.dto';
import { CreateComissaoDto } from './dto/create-comissao.dto';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { CreateCentroCustoDto } from './dto/create-centro-custo.dto';
import { CreateCaixaDto } from './dto/create-caixa.dto';
import { CreateMovimentoCaixaDto } from './dto/create-movimento-caixa.dto';
import { CreateConciliacaoDto } from './dto/create-conciliacao.dto';

const TIPOS_LANCAMENTO = Object.values(TipoLancamentoFinanceiro);
const STATUS_LANCAMENTO = Object.values(StatusLancamentoFinanceiro);
const STATUS_COBRANCA = Object.values(StatusCobranca);
const STATUS_COMISSAO = Object.values(StatusComissao);
const FORMAS = Object.values(FormaPagamentoFinanceiro);
const TIPOS_MOVIMENTO = Object.values(TipoMovimentoCaixa);

const lancamentoInclude = {
  categoria: { select: { id: true, nome: true, tipo: true } },
  centroCusto: { select: { id: true, nome: true, codigo: true } },
  cliente: { select: { id: true, nome: true } },
  contrato: { select: { id: true, tipo: true } },
  corretor: { select: { id: true, nome: true } },
  cobranca: { select: { id: true, status: true } },
} satisfies Prisma.LancamentoFinanceiroInclude;

@Injectable()
export class FinanceiroService {
  constructor(private readonly prisma: PrismaService) {}

  private async refresh(empresaId: number) {
    await Promise.all([
      atualizarCobrancasAtrasadas(this.prisma, empresaId),
      atualizarLancamentosAtrasados(this.prisma, empresaId),
      ensureCatalogoPadrao(this.prisma, empresaId),
    ]);
  }

  private parsePage(page?: number, limit?: number) {
    const p = Math.max(1, page || 1);
    const l = Math.min(100, Math.max(1, limit || 20));
    return { page: p, limit: l };
  }

  private mapContratoResumo(contrato: {
    id: number;
    tipo: string;
    valor?: number;
    clienteId?: number;
    corretorId?: number | null;
  }) {
    return {
      id: contrato.id,
      numero: contratoNumero(contrato.id),
      tipo: contrato.tipo,
      valor: contrato.valor,
      comissao: null as number | null,
      clienteId: contrato.clienteId,
      corretorId: contrato.corretorId,
    };
  }

  private mapLancamento<
    T extends { contrato?: { id: number; tipo: string } | null },
  >(item: T) {
    return {
      ...item,
      contrato: item.contrato
        ? {
            ...item.contrato,
            numero: contratoNumero(item.contrato.id),
          }
        : null,
    };
  }

  async opcoes(empresaId: number) {
    await ensureCatalogoPadrao(this.prisma, empresaId);
    const [categorias, centros, clientes, contratos, corretores] =
      await Promise.all([
        this.prisma.categoriaFinanceira.findMany({
          where: { empresaId, ativo: true },
          orderBy: [{ tipo: 'asc' }, { nome: 'asc' }],
        }),
        this.prisma.centroCusto.findMany({
          where: { empresaId, ativo: true },
          orderBy: { nome: 'asc' },
        }),
        this.prisma.cliente.findMany({
          where: {
            empresaId,
            ativo: true,
            tipo: { not: TipoCliente.PROPRIETARIO },
          },
          select: { id: true, nome: true },
          orderBy: { nome: 'asc' },
          take: 300,
        }),
        this.prisma.contrato.findMany({
          where: {
            empresaId,
            ativo: true,
            status: { in: [StatusContrato.ATIVO, StatusContrato.RASCUNHO] },
          },
          select: {
            id: true,
            tipo: true,
            valor: true,
            clienteId: true,
            corretorId: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 200,
        }),
        this.prisma.usuario.findMany({
          where: {
            empresaId,
            ativo: true,
            perfil: {
              in: [
                UserProfile.CORRETOR,
                UserProfile.GERENTE,
                UserProfile.ADMIN,
              ],
            },
          },
          select: { id: true, nome: true, comissaoPadrao: true },
          orderBy: { nome: 'asc' },
          take: 200,
        }),
      ]);

    return {
      categorias,
      centros,
      clientes,
      contratos: contratos.map((c) => this.mapContratoResumo(c)),
      corretores,
      tiposLancamento: TIPOS_LANCAMENTO,
      statusLancamento: STATUS_LANCAMENTO,
      statusCobranca: STATUS_COBRANCA,
      statusComissao: STATUS_COMISSAO,
      formasPagamento: FORMAS,
      tiposCategoria: ['RECEITA', 'DESPESA'],
      tiposMovimento: TIPOS_MOVIMENTO,
    };
  }

  async dashboard(empresaId: number) {
    await this.refresh(empresaId);
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fimMes = new Date(
      hoje.getFullYear(),
      hoje.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );
    const openStatuses: StatusLancamentoFinanceiro[] = [
      StatusLancamentoFinanceiro.ABERTO,
      StatusLancamentoFinanceiro.PARCIAL,
      StatusLancamentoFinanceiro.ATRASADO,
    ];

    const [
      aReceber,
      aPagar,
      recebidoMes,
      pagoMes,
      cobrancasAtrasadas,
      comissoesPendentes,
      comissoesPagasMes,
      serieReceber,
      seriePagar,
    ] = await Promise.all([
      this.prisma.lancamentoFinanceiro.aggregate({
        where: {
          empresaId,
          ativo: true,
          tipo: TipoLancamentoFinanceiro.A_RECEBER,
          status: { in: openStatuses },
        },
        _sum: { valor: true },
        _count: true,
      }),
      this.prisma.lancamentoFinanceiro.aggregate({
        where: {
          empresaId,
          ativo: true,
          tipo: TipoLancamentoFinanceiro.A_PAGAR,
          status: { in: openStatuses },
        },
        _sum: { valor: true },
        _count: true,
      }),
      this.prisma.lancamentoFinanceiro.aggregate({
        where: {
          empresaId,
          ativo: true,
          tipo: TipoLancamentoFinanceiro.A_RECEBER,
          status: StatusLancamentoFinanceiro.LIQUIDADO,
          dataPagamento: { gte: inicioMes, lte: fimMes },
        },
        _sum: { valorPago: true },
      }),
      this.prisma.lancamentoFinanceiro.aggregate({
        where: {
          empresaId,
          ativo: true,
          tipo: TipoLancamentoFinanceiro.A_PAGAR,
          status: StatusLancamentoFinanceiro.LIQUIDADO,
          dataPagamento: { gte: inicioMes, lte: fimMes },
        },
        _sum: { valorPago: true },
      }),
      this.prisma.cobranca.aggregate({
        where: { empresaId, status: StatusCobranca.ATRASADO },
        _sum: { valor: true },
        _count: true,
      }),
      this.prisma.comissao.aggregate({
        where: {
          empresaId,
          ativo: true,
          status: { in: [StatusComissao.PREVISTA, StatusComissao.APROVADA] },
        },
        _sum: { valor: true },
        _count: true,
      }),
      this.prisma.comissao.aggregate({
        where: {
          empresaId,
          ativo: true,
          status: StatusComissao.PAGA,
          dataPagamento: { gte: inicioMes, lte: fimMes },
        },
        _sum: { valor: true },
      }),
      this.prisma.lancamentoFinanceiro.findMany({
        where: {
          empresaId,
          ativo: true,
          tipo: TipoLancamentoFinanceiro.A_RECEBER,
          status: StatusLancamentoFinanceiro.LIQUIDADO,
          dataPagamento: {
            gte: new Date(hoje.getFullYear(), hoje.getMonth() - 5, 1),
          },
        },
        select: { dataPagamento: true, valorPago: true },
        take: 5000,
      }),
      this.prisma.lancamentoFinanceiro.findMany({
        where: {
          empresaId,
          ativo: true,
          tipo: TipoLancamentoFinanceiro.A_PAGAR,
          status: StatusLancamentoFinanceiro.LIQUIDADO,
          dataPagamento: {
            gte: new Date(hoje.getFullYear(), hoje.getMonth() - 5, 1),
          },
        },
        select: { dataPagamento: true, valorPago: true },
        take: 5000,
      }),
    ]);

    const fluxoMensal: Array<{
      competencia: string;
      label: string;
      entradas: number;
      saidas: number;
      saldo: number;
    }> = [];
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const entradas = serieReceber
        .filter(
          (item) =>
            item.dataPagamento &&
            item.dataPagamento.getFullYear() === d.getFullYear() &&
            item.dataPagamento.getMonth() === d.getMonth(),
        )
        .reduce((sum, item) => sum + (item.valorPago || 0), 0);
      const saidas = seriePagar
        .filter(
          (item) =>
            item.dataPagamento &&
            item.dataPagamento.getFullYear() === d.getFullYear() &&
            item.dataPagamento.getMonth() === d.getMonth(),
        )
        .reduce((sum, item) => sum + (item.valorPago || 0), 0);
      fluxoMensal.push({
        competencia: key,
        label: d.toLocaleDateString('pt-BR', {
          month: 'short',
          year: '2-digit',
        }),
        entradas,
        saidas,
        saldo: entradas - saidas,
      });
    }

    return {
      indicadores: {
        aReceber: aReceber._sum.valor || 0,
        aReceberQtd: aReceber._count || 0,
        aPagar: aPagar._sum.valor || 0,
        aPagarQtd: aPagar._count || 0,
        recebidoMes: recebidoMes._sum.valorPago || 0,
        pagoMes: pagoMes._sum.valorPago || 0,
        cobrancasAtrasadas: cobrancasAtrasadas._sum.valor || 0,
        cobrancasAtrasadasQtd: cobrancasAtrasadas._count || 0,
        comissoesPendentes: comissoesPendentes._sum.valor || 0,
        comissoesPendentesQtd: comissoesPendentes._count || 0,
        comissoesPagasMes: comissoesPagasMes._sum.valor || 0,
        resultadoMes:
          (recebidoMes._sum.valorPago || 0) - (pagoMes._sum.valorPago || 0),
      },
      fluxoMensal,
    };
  }

  async listarLancamentos(empresaId: number, query: QueryLancamentoDto) {
    await this.refresh(empresaId);
    const { page, limit } = this.parsePage(query.page, query.limit);
    const where: Prisma.LancamentoFinanceiroWhereInput = {
      empresaId,
      ativo: true,
      ...(query.tipo ? { tipo: query.tipo } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.categoriaId ? { categoriaId: query.categoriaId } : {}),
      ...(query.centroCustoId ? { centroCustoId: query.centroCustoId } : {}),
      ...(query.busca?.trim()
        ? {
            OR: [
              {
                descricao: {
                  contains: query.busca.trim(),
                  mode: 'insensitive',
                },
              },
              {
                observacoes: {
                  contains: query.busca.trim(),
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
    };

    const [total, data] = await this.prisma.$transaction([
      this.prisma.lancamentoFinanceiro.count({ where }),
      this.prisma.lancamentoFinanceiro.findMany({
        where,
        include: lancamentoInclude,
        orderBy: [{ vencimento: 'asc' }, { id: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: data.map((item) => this.mapLancamento(item)),
      meta: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  async criarLancamento(empresaId: number, dto: CreateLancamentoDto) {
    await this.validateFinanceRelations(empresaId, dto);
    const vencimento = new Date(dto.vencimento);
    if (Number.isNaN(vencimento.getTime())) {
      throw new BadRequestException('Vencimento inválido');
    }

    let status = dto.status || StatusLancamentoFinanceiro.ABERTO;
    if (!dto.status && vencimento < new Date()) {
      status = StatusLancamentoFinanceiro.ATRASADO;
    }

    const created = await this.prisma.lancamentoFinanceiro.create({
      data: {
        empresaId,
        tipo: dto.tipo,
        descricao: dto.descricao.trim(),
        valor: dto.valor,
        valorPago: 0,
        vencimento,
        status,
        formaPagamento: dto.formaPagamento || null,
        categoriaId: dto.categoriaId || null,
        centroCustoId: dto.centroCustoId || null,
        clienteId: dto.clienteId || null,
        contratoId: dto.contratoId || null,
        corretorId: dto.corretorId || null,
        observacoes: dto.observacoes?.trim() || null,
      },
      include: lancamentoInclude,
    });

    return this.mapLancamento(created);
  }

  async liquidarLancamento(
    empresaId: number,
    id: number,
    dto: LiquidarLancamentoDto,
  ) {
    const existing = await this.prisma.lancamentoFinanceiro.findFirst({
      where: { id, empresaId, ativo: true },
    });
    if (!existing) throw new NotFoundException('Lançamento não encontrado');
    const liquidavel: StatusLancamentoFinanceiro[] = [
      StatusLancamentoFinanceiro.ABERTO,
      StatusLancamentoFinanceiro.PARCIAL,
      StatusLancamentoFinanceiro.ATRASADO,
    ];
    if (!liquidavel.includes(existing.status)) {
      throw new ConflictException('Este lançamento não pode ser liquidado');
    }

    const valorPago = dto.valorPago != null ? dto.valorPago : existing.valor;
    if (!Number.isFinite(valorPago) || valorPago <= 0) {
      throw new BadRequestException('Valor pago inválido');
    }
    const dataPagamento = dto.dataPagamento
      ? new Date(dto.dataPagamento)
      : new Date();
    const status =
      valorPago >= existing.valor
        ? StatusLancamentoFinanceiro.LIQUIDADO
        : StatusLancamentoFinanceiro.PARCIAL;

    const updated = await this.prisma.$transaction(async (tx) => {
      const lancamento = await tx.lancamentoFinanceiro.update({
        where: { id: existing.id },
        data: {
          status,
          valorPago,
          dataPagamento,
          formaPagamento: dto.formaPagamento || existing.formaPagamento,
        },
        include: lancamentoInclude,
      });

      if (
        lancamento.cobranca?.id &&
        status === StatusLancamentoFinanceiro.LIQUIDADO
      ) {
        await tx.cobranca.update({
          where: { id: lancamento.cobranca.id },
          data: {
            status: StatusCobranca.PAGO,
            pagamento: dataPagamento,
            formaPagamento: dto.formaPagamento || undefined,
          },
        });
      }

      if (
        dto.registrarNoCaixa !== false &&
        status === StatusLancamentoFinanceiro.LIQUIDADO
      ) {
        await this.ensureMovimentoCaixa(tx, {
          empresaId,
          data: dataPagamento,
          tipo:
            existing.tipo === TipoLancamentoFinanceiro.A_RECEBER
              ? TipoMovimentoCaixa.ENTRADA
              : TipoMovimentoCaixa.SAIDA,
          descricao: existing.descricao,
          valor: valorPago,
          formaPagamento: dto.formaPagamento || null,
          lancamentoId: existing.id,
        });
      }

      return lancamento;
    });

    return this.mapLancamento(updated);
  }

  async listarCobrancas(
    empresaId: number,
    query: {
      page?: number;
      limit?: number;
      status?: StatusCobranca;
      busca?: string;
    },
  ) {
    await atualizarCobrancasAtrasadas(this.prisma, empresaId);
    const { page, limit } = this.parsePage(query.page, query.limit);
    const where: Prisma.CobrancaWhereInput = {
      empresaId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.busca?.trim()
        ? {
            descricao: {
              contains: query.busca.trim(),
              mode: 'insensitive' as const,
            },
          }
        : {}),
    };

    const [total, cobrancas] = await this.prisma.$transaction([
      this.prisma.cobranca.count({ where }),
      this.prisma.cobranca.findMany({
        where,
        include: {
          contrato: {
            select: {
              id: true,
              tipo: true,
              empresaId: true,
              cliente: { select: { id: true, nome: true, empresaId: true } },
              property: {
                select: {
                  id: true,
                  titulo: true,
                  codigo: true,
                  empresaId: true,
                },
              },
              corretor: { select: { id: true, nome: true, empresaId: true } },
            },
          },
          categoria: { select: { id: true, nome: true } },
          centroCusto: { select: { id: true, nome: true } },
        },
        orderBy: { vencimento: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: cobrancas.map((c) => ({
        ...c,
        contrato:
          c.contrato?.empresaId === empresaId
            ? {
                id: c.contrato.id,
                numero: contratoNumero(c.contrato.id),
                tipo: c.contrato.tipo,
                cliente:
                  c.contrato.cliente?.empresaId === empresaId
                    ? {
                        id: c.contrato.cliente.id,
                        nome: c.contrato.cliente.nome,
                      }
                    : null,
                imovel:
                  c.contrato.property?.empresaId === empresaId
                    ? {
                        id: c.contrato.property.id,
                        titulo: c.contrato.property.titulo,
                        codigo: c.contrato.property.codigo,
                      }
                    : null,
                corretor:
                  c.contrato.corretor?.empresaId === empresaId
                    ? {
                        id: c.contrato.corretor.id,
                        nome: c.contrato.corretor.nome,
                      }
                    : null,
              }
            : null,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  async criarCobranca(empresaId: number, dto: CreateCobrancaDto) {
    const vencimento = new Date(dto.vencimento);
    if (Number.isNaN(vencimento.getTime())) {
      throw new BadRequestException('Vencimento inválido');
    }
    const contrato = await this.prisma.contrato.findFirst({
      where: { id: dto.contratoId, empresaId, ativo: true },
    });
    if (!contrato) {
      throw new BadRequestException('Contrato inválido para esta empresa');
    }

    const cobranca = await this.prisma.$transaction(async (tx) => {
      const created = await tx.cobranca.create({
        data: {
          empresaId,
          contratoId: dto.contratoId,
          descricao: dto.descricao.trim(),
          valor: dto.valor,
          vencimento,
          categoriaId: dto.categoriaId || null,
          centroCustoId: dto.centroCustoId || null,
          formaPagamento: dto.formaPagamento || null,
          pagamento: null,
          status:
            vencimento < new Date()
              ? StatusCobranca.ATRASADO
              : StatusCobranca.PENDENTE,
        },
      });
      await this.syncLancamentoFromCobranca(tx, created, contrato);
      return tx.cobranca.findFirst({
        where: { id: created.id },
        include: {
          contrato: {
            select: {
              id: true,
              tipo: true,
              cliente: { select: { nome: true } },
            },
          },
          lancamento: { select: { id: true, status: true } },
        },
      });
    });

    if (!cobranca) throw new NotFoundException('Cobrança não encontrada');
    return {
      ...cobranca,
      contrato: cobranca.contrato
        ? {
            ...cobranca.contrato,
            numero: contratoNumero(cobranca.contrato.id),
          }
        : null,
    };
  }

  async pagarCobranca(empresaId: number, id: number, dto: PagarCobrancaDto) {
    const existe = await this.prisma.cobranca.findFirst({
      where: { id, empresaId },
      include: { contrato: true },
    });
    if (!existe) throw new NotFoundException('Cobrança não encontrada');
    const cobrancaPagaivel: StatusCobranca[] = [
      StatusCobranca.PENDENTE,
      StatusCobranca.ATRASADO,
    ];
    if (!cobrancaPagaivel.includes(existe.status)) {
      throw new ConflictException(
        'Apenas cobranças pendentes ou atrasadas podem receber pagamento',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.cobranca.update({
        where: { id: existe.id },
        data: {
          status: StatusCobranca.PAGO,
          pagamento: new Date(),
          ...(dto.formaPagamento ? { formaPagamento: dto.formaPagamento } : {}),
        },
      });
      await this.syncLancamentoFromCobranca(tx, updated, existe.contrato);

      const refreshed = await tx.cobranca.findFirst({
        where: { id: updated.id },
      });
      if (refreshed?.lancamentoId) {
        await this.ensureMovimentoCaixa(tx, {
          empresaId,
          data: new Date(),
          tipo: TipoMovimentoCaixa.ENTRADA,
          descricao: refreshed.descricao,
          valor: refreshed.valor,
          formaPagamento: dto.formaPagamento || null,
          lancamentoId: refreshed.lancamentoId,
        });
      }
      return refreshed;
    });
  }

  async gerarCobrancasMensais(empresaId: number) {
    await ensureCatalogoPadrao(this.prisma, empresaId);
    const hoje = new Date();
    const mes = hoje.getMonth();
    const ano = hoje.getFullYear();
    const inicioCompetencia = new Date(ano, mes, 1);
    const inicioProximaCompetencia = new Date(ano, mes + 1, 1);
    const ultimoDiaCompetencia = new Date(ano, mes + 1, 0).getDate();
    const catAluguel = await this.prisma.categoriaFinanceira.findFirst({
      where: { empresaId, codigo: 'REC-ALUGUEL' },
    });

    const cobrancasCriadas = await this.prisma.$transaction(async (tx) => {
      const contratos = await tx.contrato.findMany({
        where: {
          empresaId,
          ativo: true,
          status: StatusContrato.ATIVO,
          tipo: { in: [TipoContrato.ALUGUEL, TipoContrato.ADMINISTRACAO] },
          dataInicio: { lt: inicioProximaCompetencia },
          OR: [{ dataFim: null }, { dataFim: { gte: inicioCompetencia } }],
        },
      });

      const criadas: Cobranca[] = [];
      for (const contrato of contratos) {
        const existe = await tx.cobranca.findFirst({
          where: {
            empresaId,
            contratoId: contrato.id,
            vencimento: {
              gte: inicioCompetencia,
              lt: inicioProximaCompetencia,
            },
          },
        });
        if (existe) continue;

        const dia = Math.min(10, ultimoDiaCompetencia);
        const dataVencimento = new Date(ano, mes, dia);
        const cobranca = await tx.cobranca.create({
          data: {
            empresaId,
            contratoId: contrato.id,
            descricao: `Aluguel ${String(mes + 1).padStart(2, '0')}/${ano}`,
            valor: contrato.valor,
            vencimento: dataVencimento,
            status:
              dataVencimento < hoje
                ? StatusCobranca.ATRASADO
                : StatusCobranca.PENDENTE,
            categoriaId: catAluguel?.id || null,
          },
        });
        await this.syncLancamentoFromCobranca(tx, cobranca, contrato);
        criadas.push(cobranca);
      }
      return criadas;
    });

    return {
      mensagem: `${cobrancasCriadas.length} cobranças geradas`,
      cobrancas: cobrancasCriadas,
    };
  }

  async listarComissoes(
    empresaId: number,
    query: { page?: number; limit?: number; status?: StatusComissao },
  ) {
    const { page, limit } = this.parsePage(query.page, query.limit);
    const where: Prisma.ComissaoWhereInput = {
      empresaId,
      ativo: true,
      ...(query.status ? { status: query.status } : {}),
    };

    const [total, data] = await this.prisma.$transaction([
      this.prisma.comissao.count({ where }),
      this.prisma.comissao.findMany({
        where,
        include: {
          corretor: { select: { id: true, nome: true } },
          contrato: { select: { id: true, tipo: true } },
          centroCusto: { select: { id: true, nome: true } },
        },
        orderBy: [{ competencia: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: data.map((item) => ({
        ...item,
        contrato: item.contrato
          ? {
              id: item.contrato.id,
              numero: contratoNumero(item.contrato.id),
              tipo: item.contrato.tipo,
            }
          : null,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  async criarComissao(empresaId: number, dto: CreateComissaoDto) {
    const corretor = await this.prisma.usuario.findFirst({
      where: { id: dto.corretorId, empresaId, ativo: true },
      select: { id: true },
    });
    if (!corretor) throw new BadRequestException('Corretor inválido');

    if (dto.contratoId) {
      const contrato = await this.prisma.contrato.findFirst({
        where: { id: dto.contratoId, empresaId, ativo: true },
        select: { id: true },
      });
      if (!contrato) throw new BadRequestException('Contrato inválido');
    }

    const created = await this.prisma.comissao.create({
      data: {
        empresaId,
        corretorId: dto.corretorId,
        contratoId: dto.contratoId || null,
        centroCustoId: dto.centroCustoId || null,
        descricao: dto.descricao.trim(),
        valorBase: dto.valorBase,
        percentual: dto.percentual,
        valor: dto.valor,
        status: dto.status || StatusComissao.PREVISTA,
        competencia: new Date(dto.competencia),
        observacoes: dto.observacoes?.trim() || null,
      },
      include: {
        corretor: { select: { id: true, nome: true } },
        contrato: { select: { id: true, tipo: true } },
      },
    });

    return {
      ...created,
      contrato: created.contrato
        ? {
            id: created.contrato.id,
            numero: contratoNumero(created.contrato.id),
            tipo: created.contrato.tipo,
          }
        : null,
    };
  }

  async aprovarComissao(empresaId: number, id: number) {
    const existing = await this.prisma.comissao.findFirst({
      where: { id, empresaId, ativo: true },
    });
    if (!existing) throw new NotFoundException('Comissão não encontrada');
    if (existing.status !== StatusComissao.PREVISTA) {
      throw new ConflictException(
        'Somente comissões previstas podem ser aprovadas',
      );
    }
    return this.prisma.comissao.update({
      where: { id: existing.id },
      data: { status: StatusComissao.APROVADA },
    });
  }

  async pagarComissao(empresaId: number, id: number) {
    const existing = await this.prisma.comissao.findFirst({
      where: { id, empresaId, ativo: true },
    });
    if (!existing) throw new NotFoundException('Comissão não encontrada');
    const comissaoPagaivel: StatusComissao[] = [
      StatusComissao.PREVISTA,
      StatusComissao.APROVADA,
    ];
    if (!comissaoPagaivel.includes(existing.status)) {
      throw new ConflictException('Comissão não pode ser paga neste status');
    }

    await ensureCatalogoPadrao(this.prisma, empresaId);
    const catComissao = await this.prisma.categoriaFinanceira.findFirst({
      where: { empresaId, codigo: 'DES-COMISSAO' },
    });

    return this.prisma.$transaction(async (tx) => {
      const lancamento = await tx.lancamentoFinanceiro.create({
        data: {
          empresaId,
          tipo: TipoLancamentoFinanceiro.A_PAGAR,
          descricao: existing.descricao,
          valor: existing.valor,
          valorPago: existing.valor,
          vencimento: new Date(),
          dataPagamento: new Date(),
          status: StatusLancamentoFinanceiro.LIQUIDADO,
          categoriaId: catComissao?.id || null,
          centroCustoId: existing.centroCustoId,
          corretorId: existing.corretorId,
          contratoId: existing.contratoId,
          competencia: existing.competencia,
        },
      });

      const comissao = await tx.comissao.update({
        where: { id: existing.id },
        data: {
          status: StatusComissao.PAGA,
          dataPagamento: new Date(),
          lancamentoId: lancamento.id,
        },
      });

      await this.ensureMovimentoCaixa(tx, {
        empresaId,
        data: new Date(),
        tipo: TipoMovimentoCaixa.SAIDA,
        descricao: existing.descricao,
        valor: existing.valor,
        comissaoId: existing.id,
        lancamentoId: lancamento.id,
      });

      return comissao;
    });
  }

  async gerarComissaoDeContrato(empresaId: number, contratoId: number) {
    const contrato = await this.prisma.contrato.findFirst({
      where: { id: contratoId, empresaId, ativo: true },
      include: {
        corretor: { select: { id: true, nome: true, comissaoPadrao: true } },
      },
    });
    if (!contrato) throw new NotFoundException('Contrato não encontrado');
    if (!contrato.corretorId) {
      throw new BadRequestException('Contrato sem corretor vinculado');
    }

    const percentual = contrato.corretor?.comissaoPadrao ?? 5;
    const valor = (contrato.valor * percentual) / 100;

    const created = await this.prisma.comissao.create({
      data: {
        empresaId,
        corretorId: contrato.corretorId,
        contratoId: contrato.id,
        descricao: `Comissão contrato ${contratoNumero(contrato.id)}`,
        valorBase: contrato.valor,
        percentual,
        valor,
        status: StatusComissao.PREVISTA,
        competencia: startOfDay(
          new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        ),
      },
      include: {
        corretor: { select: { id: true, nome: true } },
        contrato: { select: { id: true, tipo: true } },
      },
    });

    return {
      ...created,
      contrato: created.contrato
        ? {
            id: created.contrato.id,
            numero: contratoNumero(created.contrato.id),
            tipo: created.contrato.tipo,
          }
        : null,
    };
  }

  async fluxoCaixa(empresaId: number, inicioQ?: string, fimQ?: string) {
    const inicio = inicioQ
      ? new Date(inicioQ)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const fim = fimQ ? new Date(fimQ) : new Date();
    if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime())) {
      throw new BadRequestException('Período inválido');
    }

    const [receitas, despesas] = await Promise.all([
      this.prisma.lancamentoFinanceiro.findMany({
        where: {
          empresaId,
          ativo: true,
          tipo: TipoLancamentoFinanceiro.A_RECEBER,
          status: StatusLancamentoFinanceiro.LIQUIDADO,
          dataPagamento: { gte: inicio, lte: fim },
        },
        select: { dataPagamento: true, valorPago: true, valor: true },
        take: 5000,
      }),
      this.prisma.lancamentoFinanceiro.findMany({
        where: {
          empresaId,
          ativo: true,
          tipo: TipoLancamentoFinanceiro.A_PAGAR,
          status: StatusLancamentoFinanceiro.LIQUIDADO,
          dataPagamento: { gte: inicio, lte: fim },
        },
        select: { dataPagamento: true, valorPago: true, valor: true },
        take: 5000,
      }),
    ]);

    const map = new Map<
      string,
      { data: string; entradas: number; saidas: number; saldo: number }
    >();
    const bump = (date: Date, field: 'entradas' | 'saidas', value: number) => {
      const key = startOfDay(date).toISOString().slice(0, 10);
      if (!map.has(key)) {
        map.set(key, { data: key, entradas: 0, saidas: 0, saldo: 0 });
      }
      const row = map.get(key)!;
      row[field] += value;
      row.saldo = row.entradas - row.saidas;
    };
    receitas.forEach((item) => {
      if (item.dataPagamento) {
        bump(item.dataPagamento, 'entradas', item.valorPago || item.valor || 0);
      }
    });
    despesas.forEach((item) => {
      if (item.dataPagamento) {
        bump(item.dataPagamento, 'saidas', item.valorPago || item.valor || 0);
      }
    });

    const serie = [...map.values()].sort((a, b) =>
      a.data.localeCompare(b.data),
    );
    let acumulado = 0;
    const comAcumulado = serie.map((row) => {
      acumulado += row.saldo;
      return { ...row, acumulado };
    });

    return {
      periodo: { inicio, fim },
      totais: {
        entradas: comAcumulado.reduce((s, r) => s + r.entradas, 0),
        saidas: comAcumulado.reduce((s, r) => s + r.saidas, 0),
        saldo: acumulado,
      },
      serie: comAcumulado,
    };
  }

  async dre(empresaId: number, anoQ?: number, mesQ?: number) {
    const ano = anoQ || new Date().getFullYear();
    const mes = mesQ || new Date().getMonth() + 1;
    if (mes < 1 || mes > 12) throw new BadRequestException('Mês inválido');
    const { inicio, fim } = monthRange(ano, mes);

    const liquidacoes = await this.prisma.lancamentoFinanceiro.findMany({
      where: {
        empresaId,
        ativo: true,
        status: StatusLancamentoFinanceiro.LIQUIDADO,
        dataPagamento: { gte: inicio, lte: fim },
      },
      include: {
        categoria: { select: { id: true, nome: true, tipo: true } },
      },
      take: 5000,
    });

    const porCategoria = new Map<
      string | number,
      {
        categoriaId: number | null;
        nome: string;
        tipo: string;
        valor: number;
      }
    >();
    let receitas = 0;
    let despesas = 0;
    for (const item of liquidacoes) {
      const valor = item.valorPago || item.valor || 0;
      const tipoCat =
        item.tipo === TipoLancamentoFinanceiro.A_RECEBER
          ? 'RECEITA'
          : 'DESPESA';
      if (tipoCat === 'RECEITA') receitas += valor;
      else despesas += valor;
      const key = item.categoriaId || `${tipoCat}-sem`;
      if (!porCategoria.has(key)) {
        porCategoria.set(key, {
          categoriaId: item.categoriaId,
          nome:
            item.categoria?.nome ||
            (tipoCat === 'RECEITA'
              ? 'Receitas sem categoria'
              : 'Despesas sem categoria'),
          tipo: item.categoria?.tipo || tipoCat,
          valor: 0,
        });
      }
      porCategoria.get(key)!.valor += valor;
    }

    return {
      periodo: { ano, mes, inicio, fim },
      receitas,
      despesas,
      resultado: receitas - despesas,
      categorias: [...porCategoria.values()].sort((a, b) => b.valor - a.valor),
    };
  }

  async listarCaixas(empresaId: number, pageQ?: number, limitQ?: number) {
    const { page, limit } = this.parsePage(pageQ, limitQ);
    const where = { empresaId };
    const [total, data] = await this.prisma.$transaction([
      this.prisma.caixaDiario.count({ where }),
      this.prisma.caixaDiario.findMany({
        where,
        include: {
          fechadoPor: { select: { id: true, nome: true } },
          _count: { select: { movimentos: true } },
        },
        orderBy: { data: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
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

  async abrirCaixa(empresaId: number, dto: CreateCaixaDto) {
    const dataRef = dto.data
      ? startOfDay(new Date(dto.data))
      : startOfDay(new Date());
    if (Number.isNaN(dataRef.getTime())) {
      throw new BadRequestException('Data inválida');
    }
    const saldoInicial = dto.saldoInicial ?? 0;
    const existing = await this.prisma.caixaDiario.findFirst({
      where: { empresaId, data: dataRef },
    });
    if (existing) {
      throw new ConflictException('Já existe caixa para esta data');
    }
    return this.prisma.caixaDiario.create({
      data: {
        empresaId,
        data: dataRef,
        saldoInicial,
        status: StatusCaixaDiario.ABERTO,
        observacoes: dto.observacoes?.trim() || null,
      },
    });
  }

  async buscarCaixa(empresaId: number, id: number) {
    const caixa = await this.prisma.caixaDiario.findFirst({
      where: { id, empresaId },
      include: {
        fechadoPor: { select: { id: true, nome: true } },
        movimentos: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!caixa) throw new NotFoundException('Caixa não encontrado');
    const entradas = caixa.movimentos
      .filter((m) => m.tipo === TipoMovimentoCaixa.ENTRADA)
      .reduce((s, m) => s + m.valor, 0);
    const saidas = caixa.movimentos
      .filter((m) => m.tipo === TipoMovimentoCaixa.SAIDA)
      .reduce((s, m) => s + m.valor, 0);
    return {
      ...caixa,
      totais: {
        entradas,
        saidas,
        saldoAtual: caixa.saldoInicial + entradas - saidas,
      },
    };
  }

  async adicionarMovimento(
    empresaId: number,
    caixaId: number,
    dto: CreateMovimentoCaixaDto,
  ) {
    const caixa = await this.prisma.caixaDiario.findFirst({
      where: { id: caixaId, empresaId },
    });
    if (!caixa) throw new NotFoundException('Caixa não encontrado');
    if (caixa.status !== StatusCaixaDiario.ABERTO) {
      throw new ConflictException('Caixa fechado não aceita movimentos');
    }
    return this.prisma.movimentoCaixa.create({
      data: {
        empresaId,
        caixaDiarioId: caixa.id,
        tipo: dto.tipo,
        descricao: dto.descricao.trim(),
        valor: dto.valor,
        formaPagamento: dto.formaPagamento || null,
        lancamentoId: dto.lancamentoId || null,
        comissaoId: dto.comissaoId || null,
      },
    });
  }

  async fecharCaixa(user: AuthUser, id: number, observacoes?: string) {
    const caixa = await this.prisma.caixaDiario.findFirst({
      where: { id, empresaId: user.empresaId },
      include: { movimentos: true },
    });
    if (!caixa) throw new NotFoundException('Caixa não encontrado');
    if (caixa.status === StatusCaixaDiario.FECHADO) {
      throw new ConflictException('Caixa já está fechado');
    }
    const entradas = caixa.movimentos
      .filter((m) => m.tipo === TipoMovimentoCaixa.ENTRADA)
      .reduce((s, m) => s + m.valor, 0);
    const saidas = caixa.movimentos
      .filter((m) => m.tipo === TipoMovimentoCaixa.SAIDA)
      .reduce((s, m) => s + m.valor, 0);
    return this.prisma.caixaDiario.update({
      where: { id: caixa.id },
      data: {
        status: StatusCaixaDiario.FECHADO,
        saldoFinal: caixa.saldoInicial + entradas - saidas,
        fechadoPorId: user.id,
        fechadoEm: new Date(),
        observacoes: observacoes?.trim() || caixa.observacoes,
      },
    });
  }

  async listarConciliacoes(empresaId: number, pageQ?: number, limitQ?: number) {
    const { page, limit } = this.parsePage(pageQ, limitQ);
    const where = { empresaId };
    const [total, data] = await this.prisma.$transaction([
      this.prisma.conciliacao.count({ where }),
      this.prisma.conciliacao.findMany({
        where,
        include: {
          criadoPor: { select: { id: true, nome: true } },
          _count: { select: { itens: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
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

  async criarConciliacao(user: AuthUser, dto: CreateConciliacaoDto) {
    const periodoInicio = new Date(dto.periodoInicio);
    const periodoFim = new Date(dto.periodoFim);
    if (
      Number.isNaN(periodoInicio.getTime()) ||
      Number.isNaN(periodoFim.getTime())
    ) {
      throw new BadRequestException('Título e período são obrigatórios');
    }

    const lancamentos = await this.prisma.lancamentoFinanceiro.findMany({
      where: {
        empresaId: user.empresaId,
        ativo: true,
        status: StatusLancamentoFinanceiro.LIQUIDADO,
        conciliado: false,
        dataPagamento: { gte: periodoInicio, lte: periodoFim },
      },
      take: 1000,
    });

    const saldoSistema = lancamentos.reduce((sum, item) => {
      const valor = item.valorPago || item.valor || 0;
      return (
        sum +
        (item.tipo === TipoLancamentoFinanceiro.A_RECEBER ? valor : -valor)
      );
    }, 0);

    return this.prisma.$transaction(async (tx) => {
      const conc = await tx.conciliacao.create({
        data: {
          empresaId: user.empresaId,
          titulo: dto.titulo.trim(),
          periodoInicio,
          periodoFim,
          saldoExtrato: dto.saldoExtrato ?? null,
          saldoSistema,
          observacoes: dto.observacoes?.trim() || null,
          criadoPorId: user.id,
          status: StatusConciliacao.ABERTA,
        },
      });
      if (lancamentos.length) {
        await tx.conciliacaoItem.createMany({
          data: lancamentos.map((item) => ({
            empresaId: user.empresaId,
            conciliacaoId: conc.id,
            lancamentoId: item.id,
            descricao: item.descricao,
            valor:
              item.tipo === TipoLancamentoFinanceiro.A_RECEBER
                ? item.valorPago || item.valor
                : -(item.valorPago || item.valor),
            dataReferencia: item.dataPagamento,
            conciliado: false,
          })),
        });
      }
      return tx.conciliacao.findFirst({
        where: { id: conc.id },
        include: {
          itens: true,
          criadoPor: { select: { id: true, nome: true } },
          _count: { select: { itens: true } },
        },
      });
    });
  }

  async finalizarConciliacao(
    empresaId: number,
    id: number,
    body?: { saldoExtrato?: number; observacoes?: string },
  ) {
    const conc = await this.prisma.conciliacao.findFirst({
      where: { id, empresaId, status: StatusConciliacao.ABERTA },
      include: { itens: true },
    });
    if (!conc) {
      throw new NotFoundException('Conciliação aberta não encontrada');
    }

    return this.prisma.$transaction(async (tx) => {
      const lancamentoIds = conc.itens
        .map((i) => i.lancamentoId)
        .filter((v): v is number => v != null);
      if (lancamentoIds.length) {
        await tx.lancamentoFinanceiro.updateMany({
          where: { id: { in: lancamentoIds }, empresaId },
          data: { conciliado: true },
        });
      }
      await tx.conciliacaoItem.updateMany({
        where: { conciliacaoId: conc.id, empresaId },
        data: { conciliado: true },
      });
      return tx.conciliacao.update({
        where: { id: conc.id },
        data: {
          status: StatusConciliacao.CONCILIADA,
          saldoExtrato:
            body?.saldoExtrato != null ? body.saldoExtrato : conc.saldoExtrato,
          observacoes: body?.observacoes?.trim() || conc.observacoes,
        },
        include: { itens: true },
      });
    });
  }

  async listarCategorias(empresaId: number) {
    await ensureCatalogoPadrao(this.prisma, empresaId);
    const data = await this.prisma.categoriaFinanceira.findMany({
      where: { empresaId, ativo: true },
      orderBy: [{ tipo: 'asc' }, { nome: 'asc' }],
    });
    return { data };
  }

  async criarCategoria(empresaId: number, dto: CreateCategoriaDto) {
    return this.prisma.categoriaFinanceira.create({
      data: {
        empresaId,
        nome: dto.nome.trim(),
        tipo: dto.tipo,
        codigo: dto.codigo?.trim() || null,
      },
    });
  }

  async listarCentrosCusto(empresaId: number) {
    await ensureCatalogoPadrao(this.prisma, empresaId);
    const data = await this.prisma.centroCusto.findMany({
      where: { empresaId, ativo: true },
      orderBy: { nome: 'asc' },
    });
    return { data };
  }

  async criarCentroCusto(empresaId: number, dto: CreateCentroCustoDto) {
    return this.prisma.centroCusto.create({
      data: {
        empresaId,
        nome: dto.nome.trim(),
        codigo: dto.codigo?.trim() || null,
        descricao: dto.descricao?.trim() || null,
      },
    });
  }

  async exportar(
    empresaId: number,
    type: string,
    query: QueryLancamentoDto,
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    await this.refresh(empresaId);
    const where: Prisma.LancamentoFinanceiroWhereInput = {
      empresaId,
      ativo: true,
      ...(query.tipo ? { tipo: query.tipo } : {}),
      ...(query.status ? { status: query.status } : {}),
    };
    const data = await this.prisma.lancamentoFinanceiro.findMany({
      where,
      include: lancamentoInclude,
      orderBy: { vencimento: 'desc' },
      take: 5000,
    });

    if (type === 'pdf') {
      const lines = [
        'SUSSAI CRM — Relatório Financeiro',
        `Gerado em ${new Date().toLocaleString('pt-BR')}`,
        `Lançamentos: ${data.length}`,
        '',
        ...data
          .slice(0, 200)
          .map(
            (item) =>
              `#${item.id} [${item.tipo}] ${item.descricao} — R$ ${item.valor.toFixed(2)} · ${item.status} · venc. ${item.vencimento.toISOString().slice(0, 10)}`,
          ),
      ];
      return {
        buffer: Buffer.from(lines.join('\n'), 'utf8'),
        contentType: 'application/pdf',
        filename: 'financeiro-sussai.pdf',
      };
    }

    const header = [
      'ID',
      'Tipo',
      'Descrição',
      'Valor',
      'Pago',
      'Vencimento',
      'Status',
      'Categoria',
      'Cliente',
    ].join(';');
    const rows = data.map((item) =>
      [
        item.id,
        item.tipo,
        `"${item.descricao.replace(/"/g, '""')}"`,
        item.valor,
        item.valorPago,
        item.vencimento.toISOString().slice(0, 10),
        item.status,
        item.categoria?.nome || '',
        item.cliente?.nome || '',
      ].join(';'),
    );
    const csv = `\uFEFF${[header, ...rows].join('\n')}`;
    return {
      buffer: Buffer.from(csv, 'utf8'),
      contentType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      filename: 'financeiro-sussai.xlsx',
    };
  }

  private async syncLancamentoFromCobranca(
    tx: Prisma.TransactionClient,
    cobranca: Cobranca,
    contrato: Contrato | null,
  ) {
    const statusMap: Record<StatusCobranca, StatusLancamentoFinanceiro> = {
      PENDENTE: StatusLancamentoFinanceiro.ABERTO,
      ATRASADO: StatusLancamentoFinanceiro.ATRASADO,
      PAGO: StatusLancamentoFinanceiro.LIQUIDADO,
      CANCELADO: StatusLancamentoFinanceiro.CANCELADO,
    };
    const payload = {
      empresaId: cobranca.empresaId,
      tipo: TipoLancamentoFinanceiro.A_RECEBER,
      descricao: cobranca.descricao,
      valor: cobranca.valor,
      valorPago: cobranca.status === StatusCobranca.PAGO ? cobranca.valor : 0,
      vencimento: cobranca.vencimento,
      dataPagamento: cobranca.pagamento,
      status: statusMap[cobranca.status] || StatusLancamentoFinanceiro.ABERTO,
      formaPagamento: cobranca.formaPagamento || null,
      categoriaId: cobranca.categoriaId || null,
      centroCustoId: cobranca.centroCustoId || null,
      clienteId: contrato?.clienteId || null,
      contratoId: cobranca.contratoId,
      corretorId: contrato?.corretorId || null,
      competencia: startOfDay(
        new Date(
          cobranca.vencimento.getFullYear(),
          cobranca.vencimento.getMonth(),
          1,
        ),
      ),
    };

    if (cobranca.lancamentoId) {
      return tx.lancamentoFinanceiro.update({
        where: { id: cobranca.lancamentoId },
        data: payload,
      });
    }
    const lancamento = await tx.lancamentoFinanceiro.create({ data: payload });
    await tx.cobranca.update({
      where: { id: cobranca.id },
      data: { lancamentoId: lancamento.id },
    });
    return lancamento;
  }

  private async ensureMovimentoCaixa(
    tx: Prisma.TransactionClient,
    input: {
      empresaId: number;
      data: Date;
      tipo: TipoMovimentoCaixa;
      descricao: string;
      valor: number;
      formaPagamento?: FormaPagamentoFinanceiro | null;
      lancamentoId?: number | null;
      comissaoId?: number | null;
    },
  ) {
    const dia = startOfDay(input.data);
    let caixa = await tx.caixaDiario.findFirst({
      where: { empresaId: input.empresaId, data: dia },
    });
    if (!caixa) {
      caixa = await tx.caixaDiario.create({
        data: {
          empresaId: input.empresaId,
          data: dia,
          saldoInicial: 0,
          status: StatusCaixaDiario.ABERTO,
        },
      });
    }
    if (caixa.status !== StatusCaixaDiario.ABERTO) return;
    await tx.movimentoCaixa.create({
      data: {
        empresaId: input.empresaId,
        caixaDiarioId: caixa.id,
        tipo: input.tipo,
        descricao: input.descricao,
        valor: input.valor,
        formaPagamento: input.formaPagamento || null,
        lancamentoId: input.lancamentoId || null,
        comissaoId: input.comissaoId || null,
      },
    });
  }

  private async validateFinanceRelations(
    empresaId: number,
    dto: {
      clienteId?: number | null;
      contratoId?: number | null;
      corretorId?: number | null;
      categoriaId?: number | null;
      centroCustoId?: number | null;
    },
  ) {
    if (dto.clienteId) {
      const cliente = await this.prisma.cliente.findFirst({
        where: { id: dto.clienteId, empresaId, ativo: true },
        select: { id: true },
      });
      if (!cliente) throw new BadRequestException('Cliente inválido');
    }
    if (dto.contratoId) {
      const contrato = await this.prisma.contrato.findFirst({
        where: { id: dto.contratoId, empresaId, ativo: true },
        select: { id: true },
      });
      if (!contrato) throw new BadRequestException('Contrato inválido');
    }
    if (dto.corretorId) {
      const corretor = await this.prisma.usuario.findFirst({
        where: { id: dto.corretorId, empresaId, ativo: true },
        select: { id: true },
      });
      if (!corretor) throw new BadRequestException('Corretor inválido');
    }
    if (dto.categoriaId) {
      const cat = await this.prisma.categoriaFinanceira.findFirst({
        where: { id: dto.categoriaId, empresaId, ativo: true },
        select: { id: true },
      });
      if (!cat) throw new BadRequestException('Categoria inválida');
    }
    if (dto.centroCustoId) {
      const centro = await this.prisma.centroCusto.findFirst({
        where: { id: dto.centroCustoId, empresaId, ativo: true },
        select: { id: true },
      });
      if (!centro) throw new BadRequestException('Centro de custo inválido');
    }
  }
}
