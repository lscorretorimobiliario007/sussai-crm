import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PipelineService } from '../pipeline/pipeline.service';
import { CreateCompanyDto, UpdateCompanyDto } from './dto/create-company.dto';

@Injectable()
export class CompaniesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pipelineService: PipelineService,
  ) {}

  async create(dto: CreateCompanyDto) {
    try {
      const empresa = await this.prisma.empresa.create({
        data: {
          nome: dto.nome.trim(),
          cnpj: dto.cnpj.replace(/\D/g, ''),
          email: dto.email?.trim().toLowerCase() || null,
          telefone: dto.telefone?.trim() || null,
        },
      });

      await this.pipelineService.ensureDefaultStages(empresa.id);

      return {
        ...empresa,
        pipelineStages: await this.pipelineService.listStages(empresa.id),
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Já existe uma empresa com este CNPJ');
      }
      throw error;
    }
  }

  findAll() {
    return this.prisma.empresa.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const empresa = await this.prisma.empresa.findUnique({ where: { id } });
    if (!empresa) {
      throw new NotFoundException(`Empresa #${id} não encontrada`);
    }
    return empresa;
  }

  async update(id: number, dto: UpdateCompanyDto) {
    await this.findOne(id);

    return this.prisma.empresa.update({
      where: { id },
      data: {
        ...(dto.nome !== undefined && { nome: dto.nome.trim() }),
        ...(dto.email !== undefined && {
          email: dto.email?.trim().toLowerCase() || null,
        }),
        ...(dto.telefone !== undefined && {
          telefone: dto.telefone?.trim() || null,
        }),
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.empresa.delete({ where: { id } });
    return { mensagem: 'Empresa removida com sucesso', id };
  }
}
