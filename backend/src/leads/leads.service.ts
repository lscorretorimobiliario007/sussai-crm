import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LeadOrigem, LeadStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PipelineService } from '../pipeline/pipeline.service';
import { mapStageNameToStatus } from '../pipeline/pipeline.constants';
import { CreateLeadDto } from './dto/create-lead.dto';
import { QueryLeadDto } from './dto/query-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { MoveLeadDto } from './dto/move-lead.dto';

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

type PaginatedLeads = {
  data: LeadWithRelations[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

@Injectable()
export class LeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pipelineService: PipelineService,
  ) {}

  async create(
    empresaId: number,
    dto: CreateLeadDto,
  ): Promise<LeadWithRelations> {
    await this.validateRelations(empresaId, dto.propertyId, dto.assignedUserId);

    const defaultStage = await this.pipelineService.getDefaultStage(empresaId);

    return this.prisma.lead.create({
      data: {
        empresaId,
        propertyId: dto.propertyId ?? null,
        assignedUserId: dto.assignedUserId ?? null,
        stageId: defaultStage.id,
        nome: dto.nome.trim(),
        email: this.normalizeOptionalText(dto.email)?.toLowerCase() ?? null,
        telefone: this.normalizeOptionalText(dto.telefone),
        whatsapp: this.normalizeOptionalText(dto.whatsapp),
        origem: dto.origem ?? LeadOrigem.MANUAL,
        status: dto.status ?? LeadStatus.NOVO,
        mensagem: this.normalizeOptionalText(dto.mensagem),
        observacoes: this.normalizeOptionalText(dto.observacoes),
        ultimoContatoEm: this.parseOptionalDate(dto.ultimoContatoEm),
        ativo: true,
      },
      include: leadInclude,
    });
  }

  async findAll(
    empresaId: number,
    query: QueryLeadDto,
  ): Promise<PaginatedLeads> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = this.buildWhere(empresaId, query);

    const [data, total] = await this.prisma.$transaction([
      this.prisma.lead.findMany({
        where,
        include: leadInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.lead.count({ where }),
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

  async findOne(empresaId: number, id: number): Promise<LeadWithRelations> {
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

    return lead;
  }

  async update(
    empresaId: number,
    id: number,
    dto: UpdateLeadDto,
  ): Promise<LeadWithRelations> {
    await this.findOne(empresaId, id);
    await this.validateRelations(empresaId, dto.propertyId, dto.assignedUserId);

    const data: Prisma.LeadUpdateInput = {};

    if (dto.propertyId !== undefined) {
      data.property = dto.propertyId
        ? { connect: { id: dto.propertyId } }
        : { disconnect: true };
    }

    if (dto.assignedUserId !== undefined) {
      data.assignedUser = dto.assignedUserId
        ? { connect: { id: dto.assignedUserId } }
        : { disconnect: true };
    }

    if (dto.nome !== undefined) data.nome = dto.nome.trim();
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
    if (dto.observacoes !== undefined) {
      data.observacoes = this.normalizeOptionalText(dto.observacoes);
    }
    if (dto.ultimoContatoEm !== undefined) {
      data.ultimoContatoEm = this.parseOptionalDate(dto.ultimoContatoEm);
    }

    return this.prisma.lead.update({
      where: { id },
      data,
      include: leadInclude,
    });
  }

  async move(
    empresaId: number,
    userId: number,
    leadId: number,
    dto: MoveLeadDto,
  ): Promise<LeadWithRelations> {
    const lead = await this.findOne(empresaId, leadId);
    const stage = await this.pipelineService.findStageOrFail(
      empresaId,
      dto.stageId,
    );

    if (lead.stageId === stage.id) {
      throw new BadRequestException('O lead já está nesta etapa');
    }

    const mappedStatus = mapStageNameToStatus(stage.nome);

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
          observacao: this.normalizeOptionalText(dto.observacao),
        },
      });

      return nextLead;
    });

    return updated;
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
      leads: leads.filter((lead) => lead.stageId === stage.id),
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
    if (query.assignedUserId) where.assignedUserId = query.assignedUserId;
    if (query.propertyId) where.propertyId = query.propertyId;

    if (query.search?.trim()) {
      const term = query.search.trim();
      where.OR = [
        { nome: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
        { telefone: { contains: term, mode: 'insensitive' } },
        { whatsapp: { contains: term, mode: 'insensitive' } },
        { mensagem: { contains: term, mode: 'insensitive' } },
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
