import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PipelineStage, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DEFAULT_PIPELINE_STAGES } from './pipeline.constants';
import {
  CreatePipelineStageDto,
  UpdatePipelineStageDto,
} from './dto/pipeline-stage.dto';

@Injectable()
export class PipelineService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureDefaultStages(empresaId: number): Promise<PipelineStage[]> {
    const existing = await this.prisma.pipelineStage.count({
      where: { empresaId },
    });

    if (existing === 0) {
      await this.prisma.pipelineStage.createMany({
        data: DEFAULT_PIPELINE_STAGES.map((stage) => ({
          empresaId,
          nome: stage.nome,
          ordem: stage.ordem,
          cor: stage.cor,
          ativo: true,
        })),
      });
    }

    return this.listStages(empresaId, false);
  }

  async getDefaultStage(empresaId: number): Promise<PipelineStage> {
    const stages = await this.ensureDefaultStages(empresaId);
    const first = stages.find((stage) => stage.ativo) || stages[0];

    if (!first) {
      throw new BadRequestException('Pipeline sem etapas configuradas');
    }

    return first;
  }

  async listStages(empresaId: number, ensure = true): Promise<PipelineStage[]> {
    if (ensure) {
      await this.ensureDefaultStages(empresaId);
    }

    return this.prisma.pipelineStage.findMany({
      where: {
        empresaId,
        ativo: true,
      },
      orderBy: { ordem: 'asc' },
    });
  }

  async createStage(
    empresaId: number,
    dto: CreatePipelineStageDto,
  ): Promise<PipelineStage> {
    await this.ensureDefaultStages(empresaId);

    const ordem =
      dto.ordem ??
      ((
        await this.prisma.pipelineStage.aggregate({
          where: { empresaId },
          _max: { ordem: true },
        })
      )._max.ordem ?? 0) + 1;

    try {
      return await this.prisma.pipelineStage.create({
        data: {
          empresaId,
          nome: dto.nome.trim(),
          ordem,
          cor: dto.cor || '#6366f1',
          ativo: true,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Já existe uma etapa com esta ordem');
      }
      throw error;
    }
  }

  async updateStage(
    empresaId: number,
    id: number,
    dto: UpdatePipelineStageDto,
  ): Promise<PipelineStage> {
    const stage = await this.findStageOrFail(empresaId, id);

    try {
      return await this.prisma.pipelineStage.update({
        where: { id: stage.id },
        data: {
          ...(dto.nome !== undefined && { nome: dto.nome.trim() }),
          ...(dto.ordem !== undefined && { ordem: dto.ordem }),
          ...(dto.cor !== undefined && { cor: dto.cor }),
          ...(dto.ativo !== undefined && { ativo: dto.ativo }),
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Já existe uma etapa com esta ordem');
      }
      throw error;
    }
  }

  async removeStage(empresaId: number, id: number) {
    const stage = await this.findStageOrFail(empresaId, id);

    const leadsCount = await this.prisma.lead.count({
      where: {
        empresaId,
        stageId: stage.id,
        ativo: true,
      },
    });

    if (leadsCount > 0) {
      throw new BadRequestException(
        'Não é possível remover uma etapa com leads ativos. Mova os leads antes.',
      );
    }

    await this.prisma.pipelineStage.update({
      where: { id: stage.id },
      data: { ativo: false },
    });

    return {
      mensagem: 'Etapa desativada com sucesso',
      id: stage.id,
    };
  }

  async findStageOrFail(empresaId: number, id: number): Promise<PipelineStage> {
    const stage = await this.prisma.pipelineStage.findFirst({
      where: {
        id,
        empresaId,
        ativo: true,
      },
    });

    if (!stage) {
      throw new NotFoundException(`Etapa #${id} não encontrada`);
    }

    return stage;
  }
}
