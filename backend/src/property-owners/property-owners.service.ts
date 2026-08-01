import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePropertyOwnerDto } from './dto/create-property-owner.dto';
import { QueryPropertyOwnerDto } from './dto/query-property-owner.dto';
import { UpdatePropertyOwnerDto } from './dto/update-property-owner.dto';

type NormalizedPropertyOwnerData = Partial<
  Pick<
    Prisma.PropertyOwnerUncheckedCreateInput,
    | 'nome'
    | 'cpf'
    | 'cnpj'
    | 'rg'
    | 'telefone'
    | 'celular'
    | 'whatsapp'
    | 'email'
    | 'cep'
    | 'rua'
    | 'numero'
    | 'complemento'
    | 'bairro'
    | 'cidade'
    | 'estado'
    | 'observacoes'
  >
>;

@Injectable()
export class PropertyOwnersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(empresaId: number, dto: CreatePropertyOwnerDto) {
    const data = this.normalizeData(dto);
    this.validateDocuments(data.cpf, data.cnpj);

    try {
      return await this.prisma.propertyOwner.create({
        data: { ...data, nome: dto.nome.trim(), empresaId },
      });
    } catch (error) {
      this.handleUniqueConstraint(error);
      throw error;
    }
  }

  async findAll(empresaId: number, query: QueryPropertyOwnerDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const search = query.busca?.trim();
    const searchDigits = this.digits(search);
    const where: Prisma.PropertyOwnerWhereInput = {
      empresaId,
      ativo: query.ativo ?? true,
      ...(query.cidade?.trim()
        ? { cidade: { contains: query.cidade.trim(), mode: 'insensitive' } }
        : {}),
      ...(search
        ? {
            OR: [
              { nome: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              ...(searchDigits
                ? [
                    { cpf: { contains: searchDigits } },
                    { cnpj: { contains: searchDigits } },
                    { telefone: { contains: searchDigits } },
                    { celular: { contains: searchDigits } },
                  ]
                : []),
            ],
          }
        : {}),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.propertyOwner.findMany({
        where,
        include: { _count: { select: { properties: true } } },
        orderBy: [{ nome: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.propertyOwner.count({ where }),
    ]);

    return {
      data: rows.map((item) => ({
        ...item,
        tipoPessoa: item.cnpj ? 'PJ' : 'PF',
        status: item.ativo ? 'CLIENTE' : 'INATIVO',
        cpfCnpj: item.cpf || item.cnpj,
        endereco: item.rua,
        notas: item.observacoes,
        _count: { imoveisProprietario: item._count.properties },
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  async options(empresaId: number, search?: string) {
    const term = search?.trim();
    const termDigits = this.digits(term);
    const proprietarios = await this.prisma.propertyOwner.findMany({
      where: {
        empresaId,
        ativo: true,
        ...(term
          ? {
              OR: [
                { nome: { contains: term, mode: 'insensitive' } },
                ...(termDigits
                  ? [
                      { cpf: { contains: termDigits } },
                      { cnpj: { contains: termDigits } },
                    ]
                  : []),
              ],
            }
          : {}),
      },
      select: {
        id: true,
        nome: true,
        cpf: true,
        cnpj: true,
        telefone: true,
        celular: true,
      },
      orderBy: [{ nome: 'asc' }, { id: 'asc' }],
      take: 30,
    });

    return { proprietarios, corretores: [] };
  }

  async dashboard(empresaId: number) {
    const [total, imoveis, values] = await Promise.all([
      this.prisma.propertyOwner.count({ where: { empresaId, ativo: true } }),
      this.prisma.property.count({
        where: { empresaId, ativo: true, proprietarioId: { not: null } },
      }),
      this.prisma.property.aggregate({
        where: { empresaId, ativo: true, proprietarioId: { not: null } },
        _sum: { valorVenda: true, valorLocacao: true },
      }),
    ]);

    return {
      resumo: {
        total,
        imoveis,
        contratosAtivos: 0,
        valorVenda: values._sum.valorVenda ?? 0,
        valorLocacao: values._sum.valorLocacao ?? 0,
      },
    };
  }

  async findOne(empresaId: number, id: number) {
    const owner = await this.prisma.propertyOwner.findFirst({
      where: { id, empresaId },
      include: {
        properties: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            codigo: true,
            titulo: true,
            ativo: true,
            cidade: true,
            valorVenda: true,
            valorLocacao: true,
          },
        },
      },
    });

    if (!owner) throw new NotFoundException('Proprietário não encontrado');

    const activeProperties = owner.properties.filter(
      (property) => property.ativo,
    );
    return {
      ...owner,
      cpfCnpj: owner.cpf || owner.cnpj,
      endereco: owner.rua,
      notas: owner.observacoes,
      imoveisProprietario: owner.properties,
      dadosBancarios: [],
      documentos: [],
      anotacoes: [],
      historico: [],
      dashboard: {
        imoveis: activeProperties.length,
        contratosAtivos: 0,
        valorVenda: activeProperties.reduce(
          (total, property) => total + (property.valorVenda ?? 0),
          0,
        ),
        valorAluguel: activeProperties.reduce(
          (total, property) => total + (property.valorLocacao ?? 0),
          0,
        ),
      },
    };
  }

  async update(empresaId: number, id: number, dto: UpdatePropertyOwnerDto) {
    await this.ensureOwner(empresaId, id);
    if (dto.nome !== undefined && !dto.nome?.trim()) {
      throw new BadRequestException('Informe o nome do proprietário');
    }
    const data = this.normalizeData(dto);
    this.validateDocuments(data.cpf, data.cnpj);

    try {
      return await this.prisma.propertyOwner.update({
        where: { id },
        data,
      });
    } catch (error) {
      this.handleUniqueConstraint(error);
      throw error;
    }
  }

  async remove(empresaId: number, id: number) {
    await this.ensureOwner(empresaId, id);
    const activeProperty = await this.prisma.property.findFirst({
      where: { empresaId, proprietarioId: id, ativo: true },
      select: { id: true },
    });
    if (activeProperty) {
      throw new ConflictException(
        'Não é possível desativar um proprietário com imóveis ativos',
      );
    }

    await this.prisma.propertyOwner.update({
      where: { id },
      data: { ativo: false },
    });
    return { mensagem: 'Proprietário desativado com sucesso' };
  }

  async reactivate(empresaId: number, id: number) {
    const owner = await this.prisma.propertyOwner.findFirst({
      where: { id, empresaId },
      select: { id: true },
    });
    if (!owner) throw new NotFoundException('Proprietário não encontrado');
    return this.prisma.propertyOwner.update({
      where: { id },
      data: { ativo: true },
    });
  }

  private async ensureOwner(empresaId: number, id: number) {
    const owner = await this.prisma.propertyOwner.findFirst({
      where: { id, empresaId },
      select: { id: true },
    });
    if (!owner) throw new NotFoundException('Proprietário não encontrado');
    return owner;
  }

  private normalizeData(
    dto: CreatePropertyOwnerDto | UpdatePropertyOwnerDto,
  ): NormalizedPropertyOwnerData {
    const normalized: Record<string, string | null> = {};
    const textFields = [
      'nome',
      'rg',
      'email',
      'rua',
      'numero',
      'complemento',
      'bairro',
      'cidade',
      'observacoes',
    ] as const;
    const digitFields = [
      'cpf',
      'cnpj',
      'telefone',
      'celular',
      'whatsapp',
      'cep',
    ] as const;

    for (const field of textFields) {
      if (dto[field] !== undefined) {
        normalized[field] = dto[field]?.trim() || null;
      }
    }
    for (const field of digitFields) {
      if (dto[field] !== undefined) {
        normalized[field] = this.digits(dto[field]) || null;
      }
    }
    if (dto.estado !== undefined) {
      normalized.estado = dto.estado?.trim().toUpperCase() || null;
    }
    if (typeof normalized.email === 'string') {
      normalized.email = normalized.email.toLowerCase();
    }

    return normalized;
  }

  private validateDocuments(cpf?: string | null, cnpj?: string | null): void {
    if (cpf && !this.isValidCpf(cpf)) {
      throw new BadRequestException('CPF inválido');
    }
    if (cnpj && !this.isValidCnpj(cnpj)) {
      throw new BadRequestException('CNPJ inválido');
    }
  }

  private digits(value?: string | null): string {
    return (value ?? '').replace(/\D/g, '');
  }

  private isValidCpf(value: string): boolean {
    const cpf = this.digits(value);
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
    const digit = (length: number) => {
      let sum = 0;
      for (let index = 0; index < length; index += 1) {
        sum += Number(cpf[index]) * (length + 1 - index);
      }
      const remainder = (sum * 10) % 11;
      return remainder === 10 ? 0 : remainder;
    };
    return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10]);
  }

  private isValidCnpj(value: string): boolean {
    const cnpj = this.digits(value);
    if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;
    const calculate = (length: number) => {
      const weights =
        length === 12
          ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
          : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
      const sum = weights.reduce(
        (total, weight, index) => total + Number(cnpj[index]) * weight,
        0,
      );
      const remainder = sum % 11;
      return remainder < 2 ? 0 : 11 - remainder;
    };
    return (
      calculate(12) === Number(cnpj[12]) && calculate(13) === Number(cnpj[13])
    );
  }

  private handleUniqueConstraint(error: unknown): void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(
        'Já existe um proprietário com este CPF ou CNPJ',
      );
    }
  }
}
