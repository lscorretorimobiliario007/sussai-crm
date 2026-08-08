import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LeadOrigem, LeadStatus, Prisma, UserProfile } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PipelineService } from '../pipeline/pipeline.service';
import { mapStageNameToStatus } from '../pipeline/pipeline.constants';
import { CreateLeadDto } from './dto/create-lead.dto';
import { QueryLeadDto } from './dto/query-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { MoveLeadDto } from './dto/move-lead.dto';
import type { AuthUser } from '../auth/types/auth-user.type';

const leadInclude = {
  property: {
    select: {
      id: true,
      codigo: true,
      titulo: true,
      cidade: true,
      bairro: true,
      tipo: true,
      finalidade: true,
    },
  },
  assignedUser: {
    select: {
      id: true,
      nome: true,
      email: true,
      perfil: true,
    },
  },
  stage: {
    select: {
      id: true,
      nome: true,
      ordem: true,
      cor: true,
    },
  },
} satisfies Prisma.LeadInclude;

type LeadWithRelations = Prisma.LeadGetPayload<{ include: typeof leadInclude }>;

type StageLike = {
  id: number;
  nome: string;
  ordem: number;
  cor: string;
};

type EtapaTipo = 'ABERTA' | 'GANHO' | 'PERDIDO';

type SerializedEtapa = StageLike & {
  codigo: string;
  tipo: EtapaTipo;
  probabilidadePadrao: number;
};

type SerializedLead = LeadWithRelations & {
  titulo: string;
  etapaId: number | null;
  etapa: SerializedEtapa | null;
  corretor: LeadWithRelations['assignedUser'];
  imovel: LeadWithRelations['property'];
  cliente: null;
  valor: null;
  valorPrevisto: null;
  probabilidade: number;
  _count: {
    comentarios: number;
    anexos: number;
    tarefas: number;
    eventosAgenda: number;
  };
};

type PaginatedLeads = {
  data: SerializedLead[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  etapas: SerializedEtapa[];
};

const MOTIVOS_PERDA = [
  'Preço',
  'Financiamento',
  'Concorrência',
  'Desistência',
  'Imóvel inadequado',
  'Sem retorno',
  'Outro',
] as const;

@Injectable()
export class LeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pipelineService: PipelineService,
  ) {}

  serializeEtapa(stage: StageLike): SerializedEtapa {
    const tipo = this.resolveEtapaTipo(stage.nome);
    return {
      ...stage,
      codigo: this.stageCodigo(stage.nome),
      tipo,
      probabilidadePadrao: this.probabilidadePadrao(tipo, stage),
    };
  }

  serializeLead(lead: LeadWithRelations): SerializedLead {
    const etapa = lead.stage ? this.serializeEtapa(lead.stage) : null;
    return {
      ...lead,
      titulo: lead.nome,
      etapaId: lead.stageId,
      etapa,
      corretor: lead.assignedUser,
      imovel: lead.property,
      cliente: null,
      valor: null,
      valorPrevisto: null,
      probabilidade: etapa?.probabilidadePadrao ?? 10,
      _count: {
        comentarios: 0,
        anexos: 0,
        tarefas: 0,
        eventosAgenda: 0,
      },
    };
  }

  async create(
    empresaId: number,
    dto: CreateLeadDto,
  ): Promise<SerializedLead> {
    const propertyId = dto.propertyId ?? dto.imovelId ?? null;
    const assignedUserId = dto.assignedUserId ?? dto.corretorId ?? null;
    const nome = (dto.nome ?? dto.titulo)?.trim();

    if (!nome) {
      throw new BadRequestException('Informe o título da oportunidade');
    }

    await this.validateRelations(empresaId, propertyId, assignedUserId);

    let stageId: number;
    if (dto.etapaId != null) {
      const stage = await this.pipelineService.findStageOrFail(
        empresaId,
        dto.etapaId,
      );
      stageId = stage.id;
    } else {
      const defaultStage = await this.pipelineService.getDefaultStage(empresaId);
      stageId = defaultStage.id;
    }

    const lead = await this.prisma.lead.create({
      data: {
        empresaId,
        propertyId,
        assignedUserId,
        stageId,
        nome,
        email: this.normalizeOptionalText(dto.email)?.toLowerCase() ?? null,
        telefone: this.normalizeOptionalText(dto.telefone),
        whatsapp: this.normalizeOptionalText(dto.whatsapp),
        origem: dto.origem ?? LeadOrigem.MANUAL,
        status: dto.status ?? LeadStatus.NOVO,
        mensagem: this.normalizeOptionalText(dto.mensagem),
        observacoes:
          this.normalizeOptionalText(dto.observacoes) ??
          this.normalizeOptionalText(dto.notas),
        ultimoContatoEm: this.parseOptionalDate(dto.ultimoContatoEm),
        ativo: true,
      },
      include: leadInclude,
    });

    return this.serializeLead(lead);
  }

  async findAll(
    empresaId: number,
    query: QueryLeadDto,
  ): Promise<PaginatedLeads> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 500;
    const where = this.buildWhere(empresaId, query);

    const [data, total, stages] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        include: leadInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.lead.count({ where }),
      this.pipelineService.listStages(empresaId),
    ]);

    return {
      data: data.map((lead) => this.serializeLead(lead)),
      meta: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
      etapas: stages.map((stage) => this.serializeEtapa(stage)),
    };
  }

  async findOne(empresaId: number, id: number): Promise<SerializedLead> {
    const lead = await this.prisma.lead.findFirst({
      where: {
        id,
        empresaId,
        ativo: true,
      },
      include: leadInclude,
    });

    if (!lead) {
      throw new NotFoundException(`Lead #${id} não encontrado`);
    }

    return this.serializeLead(lead);
  }

  async update(
    empresaId: number,
    id: number,
    dto: UpdateLeadDto,
  ): Promise<SerializedLead> {
    await this.findOne(empresaId, id);

    const propertyId =
      dto.propertyId !== undefined
        ? dto.propertyId
        : dto.imovelId !== undefined
          ? dto.imovelId
          : undefined;
    const assignedUserId =
      dto.assignedUserId !== undefined
        ? dto.assignedUserId
        : dto.corretorId !== undefined
          ? dto.corretorId
          : undefined;

    await this.validateRelations(
      empresaId,
      propertyId === undefined ? undefined : propertyId,
      assignedUserId === undefined ? undefined : assignedUserId,
    );

    const data: Prisma.LeadUpdateInput = {};

    if (propertyId !== undefined) {
      data.property = propertyId
        ? { connect: { id: propertyId } }
        : { disconnect: true };
    }

    if (assignedUserId !== undefined) {
      data.assignedUser = assignedUserId
        ? { connect: { id: assignedUserId } }
        : { disconnect: true };
    }

    if (dto.etapaId !== undefined && dto.etapaId != null) {
      const stage = await this.pipelineService.findStageOrFail(
        empresaId,
        dto.etapaId,
      );
      data.stage = { connect: { id: stage.id } };
    }

    const nome = dto.nome ?? dto.titulo;
    if (nome !== undefined) data.nome = nome.trim();
    if (dto.email !== undefined) {
      data.email = this.normalizeOptionalText(dto.email)?.toLowerCase() ?? null;
    }
    if (dto.telefone !== undefined)
      data.telefone = this.normalizeOptionalText(dto.telefone);
    if (dto.whatsapp !== undefined)
      data.whatsapp = this.normalizeOptionalText(dto.whatsapp);
    if (dto.origem !== undefined) data.origem = dto.origem;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.mensagem !== undefined)
      data.mensagem = this.normalizeOptionalText(dto.mensagem);
    if (dto.observacoes !== undefined || dto.notas !== undefined) {
      data.observacoes =
        this.normalizeOptionalText(dto.observacoes) ??
        this.normalizeOptionalText(dto.notas);
    }
    if (dto.ultimoContatoEm !== undefined) {
      data.ultimoContatoEm = this.parseOptionalDate(dto.ultimoContatoEm);
    }

    const updated = await this.prisma.lead.update({
      where: { id },
      data,
      include: leadInclude,
    });

    return this.serializeLead(updated);
  }

  async move(
    empresaId: number,
    userId: number,
    leadId: number,
    dto: MoveLeadDto,
  ): Promise<SerializedLead> {
    const stageId = dto.stageId ?? dto.etapaId;
    if (stageId == null) {
      throw new BadRequestException('Informe stageId ou etapaId');
    }

    const lead = await this.findOne(empresaId, leadId);
    const stage = await this.pipelineService.findStageOrFail(
      empresaId,
      stageId,
    );

    if (lead.stageId === stage.id) {
      throw new BadRequestException('O lead já está nesta etapa');
    }

    const mappedStatus = mapStageNameToStatus(stage.nome);
    const observacao =
      this.normalizeOptionalText(dto.observacao) ??
      this.normalizeOptionalText(dto.motivoPerda);

    const updated = await this.prisma.$transaction(async (tx) => {
      const nextLead = await tx.lead.update({
        where: { id: lead.id },
        data: {
          stageId: stage.id,
          ultimoContatoEm: new Date(),
          ...(mappedStatus ? { status: mappedStatus } : {}),
        },
        include: leadInclude,
      });

      await tx.leadHistory.create({
        data: {
          leadId: lead.id,
          userId,
          stageIdAnterior: lead.stageId,
          stageIdNovo: stage.id,
          observacao,
        },
      });

      return nextLead;
    });

    return this.serializeLead(updated);
  }

  async dashboard(empresaId: number) {
    const stages = await this.pipelineService.listStages(empresaId);
    const serializedStages = stages.map((stage) => this.serializeEtapa(stage));

    const leads = await this.prisma.lead.findMany({
      where: { empresaId, ativo: true },
      select: { id: true, status: true, stageId: true },
    });

    const ganhos = leads.filter((lead) => lead.status === LeadStatus.FECHADO);
    const perdidos = leads.filter((lead) => lead.status === LeadStatus.PERDIDO);
    const abertos = leads.filter(
      (lead) =>
        lead.status !== LeadStatus.FECHADO &&
        lead.status !== LeadStatus.PERDIDO,
    );
    const conversao =
      Math.round(
        (ganhos.length / (ganhos.length + perdidos.length)) * 100,
      ) || 0;

    return {
      resumo: {
        total: leads.length,
        abertos: abertos.length,
        ganhos: ganhos.length,
        perdidos: perdidos.length,
        valorPipeline: 0,
        valorPonderado: 0,
        valorGanho: 0,
        conversao,
        previsaoMes: 0,
      },
      funil: serializedStages.map((etapa) => ({
        etapaId: etapa.id,
        nome: etapa.nome,
        codigo: etapa.codigo,
        cor: etapa.cor,
        tipo: etapa.tipo,
        quantidade: leads.filter((lead) => lead.stageId === etapa.id).length,
        valor: 0,
      })),
      etapas: serializedStages,
    };
  }

  async opcoes(user: AuthUser) {
    const stages = await this.pipelineService.listStages(user.empresaId);

    const [corretores, clientes, imoveis] = await Promise.all([
      this.prisma.usuario.findMany({
        where: {
          empresaId: user.empresaId,
          ativo: true,
          perfil: {
            in: [
              UserProfile.CORRETOR,
              UserProfile.GERENTE,
              UserProfile.ADMIN,
            ],
          },
        },
        select: { id: true, nome: true, perfil: true },
        orderBy: { nome: 'asc' },
      }),
      this.prisma.cliente.findMany({
        where: { empresaId: user.empresaId, ativo: true },
        select: { id: true, nome: true },
        orderBy: { nome: 'asc' },
        take: 200,
      }),
      this.prisma.property.findMany({
        where: { empresaId: user.empresaId, ativo: true },
        select: { id: true, codigo: true, titulo: true },
        orderBy: { titulo: 'asc' },
        take: 200,
      }),
    ]);

    return {
      etapas: stages.map((stage) => this.serializeEtapa(stage)),
      corretores: corretores.map((item) => ({
        id: item.id,
        nome: item.nome,
        tipo: item.perfil,
      })),
      clientes,
      imoveis,
      status: Object.values(LeadStatus),
      motivosPerda: [...MOTIVOS_PERDA],
    };
  }

  async kanban(empresaId: number) {
    const stages = await this.pipelineService.listStages(empresaId);

    const leads = await this.prisma.lead.findMany({
      where: {
        empresaId,
        ativo: true,
      },
      include: leadInclude,
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    });

    return stages.map((stage) => ({
      stage: {
        id: stage.id,
        nome: stage.nome,
        cor: stage.cor,
        ordem: stage.ordem,
      },
      leads: leads
        .filter((lead) => lead.stageId === stage.id)
        .map((lead) => this.serializeLead(lead)),
    }));
  }

  async remove(
    empresaId: number,
    id: number,
  ): Promise<{ mensagem: string; id: number }> {
    await this.findOne(empresaId, id);

    await this.prisma.lead.update({
      where: { id },
      data: { ativo: false },
    });

    return {
      mensagem: 'Lead desativado com sucesso',
      id,
    };
  }

  private resolveEtapaTipo(nome: string): EtapaTipo {
    const normalized = nome
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();

    if (
      normalized.includes('fechado') ||
      normalized.includes('ganho') ||
      normalized === 'fechado' ||
      normalized === 'ganho'
    ) {
      return 'GANHO';
    }

    if (normalized.includes('perdido')) {
      return 'PERDIDO';
    }

    return 'ABERTA';
  }

  private stageCodigo(nome: string): string {
    return nome
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
  }

  private probabilidadePadrao(tipo: EtapaTipo, stage: StageLike): number {
    if (tipo === 'GANHO') return 100;
    if (tipo === 'PERDIDO') return 0;

    const status = mapStageNameToStatus(stage.nome);
    switch (status) {
      case LeadStatus.NOVO:
        return 10;
      case LeadStatus.PRIMEIRO_CONTATO:
        return 25;
      case LeadStatus.VISITA_AGENDADA:
        return 40;
      case LeadStatus.PROPOSTA:
        return 50;
      case LeadStatus.NEGOCIACAO:
        return 75;
      default:
        return Math.min(90, Math.max(10, stage.ordem * 15));
    }
  }

  private buildWhere(
    empresaId: number,
    query: QueryLeadDto,
  ): Prisma.LeadWhereInput {
    const where: Prisma.LeadWhereInput = {
      empresaId,
      ativo: true,
    };

    if (query.status) where.status = query.status;
    if (query.origem) where.origem = query.origem;

    const assignedUserId = query.assignedUserId ?? query.corretorId;
    if (assignedUserId) where.assignedUserId = assignedUserId;

    const propertyId = query.propertyId ?? query.imovelId;
    if (propertyId) where.propertyId = propertyId;

    const search = query.search?.trim() || query.busca?.trim();
    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { telefone: { contains: search, mode: 'insensitive' } },
        { whatsapp: { contains: search, mode: 'insensitive' } },
        { mensagem: { contains: search, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  private async validateRelations(
    empresaId: number,
    propertyId?: number | null,
    assignedUserId?: number | null,
  ): Promise<void> {
    if (propertyId != null) {
      const property = await this.prisma.property.findFirst({
        where: {
          id: propertyId,
          empresaId,
          ativo: true,
        },
        select: { id: true },
      });

      if (!property) {
        throw new BadRequestException('Imóvel inválido para esta empresa');
      }
    }

    if (assignedUserId != null) {
      const user = await this.prisma.usuario.findFirst({
        where: {
          id: assignedUserId,
          empresaId,
          ativo: true,
        },
        select: { id: true },
      });

      if (!user) {
        throw new BadRequestException('Corretor inválido para esta empresa');
      }
    }
  }

  private normalizeOptionalText(value?: string | null): string | null {
    if (value == null) return null;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }

  private parseOptionalDate(value?: string | null): Date | null {
    if (value == null || value === '') return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Data de último contato inválida');
    }
    return date;
  }
}
