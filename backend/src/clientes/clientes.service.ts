import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AcaoHistoricoCliente,
  InteresseCliente,
  Prisma,
  StatusCliente,
  TipoCliente,
  TipoDocumentoCliente,
  TipoPessoa,
  UserProfile,
} from '@prisma/client';

type NormalizedClienteData = {
  tipo?: TipoCliente;
  tipoPessoa?: TipoPessoa;
  status?: StatusCliente;
  nome?: string;
  razaoSocial?: string | null;
  nomeFantasia?: string | null;
  cpfCnpj?: string | null;
  email?: string | null;
  telefone?: string | null;
  whatsapp?: string | null;
  endereco?: string | null;
  cidade?: string | null;
  estado?: string | null;
  notas?: string | null;
  origem?: string | null;
  interesses?: InteresseCliente[];
  faixaPrecoMin?: number | null;
  faixaPrecoMax?: number | null;
  cidadesInteresse?: string[];
  tags?: string[];
  corretorId?: number | null;
};
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from '../auth/types/auth-user.type';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { QueryClienteDto } from './dto/query-cliente.dto';
import { ContatosClienteDto } from './dto/contatos-cliente.dto';
import { AnotacaoClienteDto } from './dto/anotacao-cliente.dto';
import { InteracaoClienteDto } from './dto/interacao-cliente.dto';
import { FavoritoClienteDto } from './dto/favorito-cliente.dto';
import { VisitaClienteDto } from './dto/visita-cliente.dto';
import { PropostaClienteDto } from './dto/proposta-cliente.dto';

const propertySelect = {
  id: true,
  codigo: true,
  titulo: true,
  cidade: true,
  bairro: true,
  valorVenda: true,
  valorLocacao: true,
  finalidade: true,
} satisfies Prisma.PropertySelect;

const listInclude = {
  corretor: { select: { id: true, nome: true } },
} satisfies Prisma.ClienteInclude;

const detailInclude = {
  corretor: {
    select: { id: true, nome: true, email: true, telefone: true },
  },
  documentos: { orderBy: { createdAt: 'desc' as const } },
  anotacoes: {
    orderBy: { createdAt: 'desc' as const },
    take: 20,
    include: { usuario: { select: { id: true, nome: true } } },
  },
  interacoes: {
    orderBy: { dataHora: 'desc' as const },
    take: 20,
    include: {
      usuario: { select: { id: true, nome: true } },
      property: { select: propertySelect },
    },
  },
  favoritos: {
    orderBy: { createdAt: 'desc' as const },
    take: 50,
    include: { property: { select: propertySelect } },
  },
  visitas: {
    orderBy: { dataHora: 'desc' as const },
    take: 20,
    include: {
      property: { select: { id: true, codigo: true, titulo: true } },
      usuario: { select: { id: true, nome: true } },
    },
  },
  propostas: {
    orderBy: { createdAt: 'desc' as const },
    take: 20,
    include: {
      property: { select: { id: true, codigo: true, titulo: true } },
      usuario: { select: { id: true, nome: true } },
    },
  },
} satisfies Prisma.ClienteInclude;

@Injectable()
export class ClientesService {
  constructor(private readonly prisma: PrismaService) {}

  async options(user: AuthUser) {
    const corretores = await this.prisma.usuario.findMany({
      where: {
        empresaId: user.empresaId,
        ativo: true,
        ...(user.perfil === UserProfile.CORRETOR ? { id: user.id } : {}),
      },
      select: { id: true, nome: true, perfil: true },
      orderBy: { nome: 'asc' },
    });

    return {
      corretores: corretores.map((item) => ({
        id: item.id,
        nome: item.nome,
        tipo: item.perfil,
      })),
      tipos: Object.values(TipoCliente),
      tiposPessoa: ['PF', 'PJ'],
      status: Object.values(StatusCliente),
      interesses: ['COMPRA', 'VENDA', 'LOCACAO', 'ADMINISTRACAO'],
      tiposContato: [
        'CELULAR',
        'COMERCIAL',
        'RESIDENCIAL',
        'WHATSAPP',
        'OUTRO',
      ],
      tiposEndereco: ['RESIDENCIAL', 'COMERCIAL', 'COBRANCA', 'OUTRO'],
      tiposDocumento: Object.values(TipoDocumentoCliente),
      tiposInteracao: [
        'LIGACAO',
        'EMAIL',
        'WHATSAPP',
        'VISITA',
        'REUNIAO',
        'OUTRO',
      ],
      statusVisita: ['AGENDADA', 'REALIZADA', 'CANCELADA', 'NAO_COMPARECEU'],
      statusProposta: [
        'RASCUNHO',
        'ENVIADA',
        'EM_ANALISE',
        'ACEITA',
        'RECUSADA',
        'CANCELADA',
      ],
    };
  }

  async findAll(user: AuthUser, query: QueryClienteDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    this.assertCorretorFilter(user, query.corretorId);

    const search = query.busca?.trim();
    const searchDigits = this.digits(search);
    const where: Prisma.ClienteWhereInput = {
      ...this.ownershipWhere(user),
      ativo: query.ativo ?? true,
      ...(query.tipo
        ? { tipo: query.tipo }
        : { tipo: { not: TipoCliente.PROPRIETARIO } }),
      ...(query.tipoPessoa ? { tipoPessoa: query.tipoPessoa } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.cidade?.trim()
        ? { cidade: { contains: query.cidade.trim(), mode: 'insensitive' } }
        : {}),
      ...(query.origem?.trim()
        ? { origem: { contains: query.origem.trim(), mode: 'insensitive' } }
        : {}),
      ...(query.tag?.trim() ? { tags: { has: query.tag.trim() } } : {}),
      ...(query.interesse ? { interesses: { has: query.interesse } } : {}),
      ...(user.perfil !== UserProfile.CORRETOR && query.corretorId
        ? { corretorId: query.corretorId }
        : {}),
      ...(query.faixaPrecoMin != null
        ? { faixaPrecoMax: { gte: query.faixaPrecoMin } }
        : {}),
      ...(query.faixaPrecoMax != null
        ? { faixaPrecoMin: { lte: query.faixaPrecoMax } }
        : {}),
      ...(search
        ? {
            OR: [
              { nome: { contains: search, mode: 'insensitive' } },
              { razaoSocial: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { telefone: { contains: search, mode: 'insensitive' } },
              { whatsapp: { contains: search, mode: 'insensitive' } },
              ...(searchDigits
                ? [{ cpfCnpj: { contains: searchDigits } }]
                : []),
              { tags: { has: search } },
            ],
          }
        : {}),
    };

    const orderBy =
      query.ordenacao === 'recentes'
        ? { createdAt: 'desc' as const }
        : query.ordenacao === 'antigos'
          ? { createdAt: 'asc' as const }
          : { nome: 'asc' as const };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.cliente.findMany({
        where,
        include: listInclude,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.cliente.count({ where }),
    ]);

    return {
      data: rows.map((row) => this.mapListCliente(row)),
      meta: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  async findOne(user: AuthUser, id: number) {
    const cliente = await this.prisma.cliente.findFirst({
      where: { id, ...this.ownershipWhere(user) },
      include: detailInclude,
    });
    if (!cliente) throw new NotFoundException('Cliente não encontrado');
    return this.mapDetailCliente(cliente);
  }

  async create(user: AuthUser, dto: CreateClienteDto) {
    if (dto.tipo === TipoCliente.PROPRIETARIO) {
      throw new BadRequestException(
        'Use o módulo Proprietários para cadastrar proprietários',
      );
    }

    const data = this.normalizeClienteData(dto);
    this.validatePriceRange(data.faixaPrecoMin, data.faixaPrecoMax);
    const corretorId =
      user.perfil === UserProfile.CORRETOR
        ? user.id
        : (data.corretorId ?? user.id);
    await this.ensureUsuario(user.empresaId, corretorId);

    const created = await this.prisma.$transaction(async (tx) => {
      const cliente = await tx.cliente.create({
        data: {
          empresaId: user.empresaId,
          corretorId,
          tipo: data.tipo ?? TipoCliente.LEAD,
          tipoPessoa: data.tipoPessoa,
          status: data.status ?? StatusCliente.PROSPECTO,
          nome: data.nome!,
          razaoSocial: data.razaoSocial,
          nomeFantasia: data.nomeFantasia,
          cpfCnpj: data.cpfCnpj,
          email: data.email,
          telefone: data.telefone,
          whatsapp: data.whatsapp,
          endereco: data.endereco,
          cidade: data.cidade,
          estado: data.estado,
          notas: data.notas,
          origem: data.origem,
          interesses: data.interesses ?? [],
          faixaPrecoMin: data.faixaPrecoMin,
          faixaPrecoMax: data.faixaPrecoMax,
          cidadesInteresse: data.cidadesInteresse ?? [],
          tags: data.tags ?? [],
        },
        include: listInclude,
      });
      await tx.clienteHistorico.create({
        data: {
          empresaId: user.empresaId,
          clienteId: cliente.id,
          usuarioId: user.id,
          acao: AcaoHistoricoCliente.CRIADO,
          alteracoes: { nome: cliente.nome, tipo: cliente.tipo },
        },
      });
      return cliente;
    });

    return this.mapListCliente(created);
  }

  async update(user: AuthUser, id: number, dto: UpdateClienteDto) {
    const previous = await this.ensureCliente(user, id, true);
    if (dto.tipo === TipoCliente.PROPRIETARIO) {
      throw new BadRequestException(
        'Use o módulo Proprietários para cadastrar proprietários',
      );
    }

    const data = this.normalizeClienteData(dto);
    this.validatePriceRange(
      data.faixaPrecoMin ?? previous.faixaPrecoMin,
      data.faixaPrecoMax ?? previous.faixaPrecoMax,
    );

    if (user.perfil === UserProfile.CORRETOR) {
      data.corretorId = user.id;
    } else if (data.corretorId) {
      await this.ensureUsuario(user.empresaId, data.corretorId);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const cliente = await tx.cliente.update({
        where: { id },
        data,
        include: listInclude,
      });
      await tx.clienteHistorico.create({
        data: {
          empresaId: user.empresaId,
          clienteId: id,
          usuarioId: user.id,
          acao: AcaoHistoricoCliente.ATUALIZADO,
          alteracoes: data,
        },
      });
      return cliente;
    });

    return this.mapListCliente(updated);
  }

  async remove(user: AuthUser, id: number) {
    if (user.perfil === UserProfile.CORRETOR) {
      throw new ForbiddenException('Corretores não podem desativar clientes');
    }
    const cliente = await this.ensureCliente(user, id, true);
    await this.prisma.$transaction([
      this.prisma.cliente.update({
        where: { id },
        data: { ativo: false, status: StatusCliente.INATIVO },
      }),
      this.prisma.clienteHistorico.create({
        data: {
          empresaId: user.empresaId,
          clienteId: id,
          usuarioId: user.id,
          acao: AcaoHistoricoCliente.DESATIVADO,
          alteracoes: { nome: cliente.nome },
        },
      }),
    ]);
    return { mensagem: 'Cliente desativado com sucesso' };
  }

  async reactivate(user: AuthUser, id: number) {
    await this.ensureCliente(user, id);
    const cliente = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.cliente.update({
        where: { id },
        data: { ativo: true, status: StatusCliente.PROSPECTO },
        include: listInclude,
      });
      await tx.clienteHistorico.create({
        data: {
          empresaId: user.empresaId,
          clienteId: id,
          usuarioId: user.id,
          acao: AcaoHistoricoCliente.REATIVADO,
        },
      });
      return updated;
    });
    return this.mapListCliente(cliente);
  }

  async updateContatos(user: AuthUser, id: number, dto: ContatosClienteDto) {
    await this.ensureCliente(user, id, true);
    const principalPhone =
      dto.telefones?.find((item) => item.principal)?.numero ||
      dto.telefones?.[0]?.numero;
    const whatsapp =
      dto.telefones?.find((item) => item.tipo === 'WHATSAPP')?.numero ||
      dto.telefones?.find((item) => item.tipo === 'CELULAR')?.numero;
    const principalEmail =
      dto.emails?.find((item) => item.principal)?.email ||
      dto.emails?.[0]?.email;
    const principalAddress =
      dto.enderecos?.find((item) => item.principal) || dto.enderecos?.[0];

    const data: Prisma.ClienteUpdateInput = {};
    if (principalPhone !== undefined) {
      data.telefone = this.normalizeOptionalText(principalPhone);
    }
    if (whatsapp !== undefined) {
      data.whatsapp = this.normalizeOptionalText(whatsapp);
    }
    if (principalEmail !== undefined) {
      data.email =
        this.normalizeOptionalText(principalEmail)?.toLowerCase() ?? null;
    }
    if (principalAddress) {
      data.endereco =
        [principalAddress.logradouro, principalAddress.numero]
          .filter(Boolean)
          .join(', ') || null;
      data.cidade = this.normalizeOptionalText(principalAddress.cidade);
      data.estado =
        this.normalizeOptionalText(principalAddress.estado)?.toUpperCase() ??
        null;
    }

    if (Object.keys(data).length > 0) {
      await this.prisma.cliente.update({ where: { id }, data });
    }

    return this.findOne(user, id);
  }

  async historico(user: AuthUser, id: number, page = 1, limit = 10) {
    await this.ensureCliente(user, id);
    const where = { empresaId: user.empresaId, clienteId: id };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.clienteHistorico.findMany({
        where,
        include: { usuario: { select: { id: true, nome: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.clienteHistorico.count({ where }),
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

  async addAnotacao(user: AuthUser, id: number, dto: AnotacaoClienteDto) {
    await this.ensureCliente(user, id, true);
    await this.prisma.$transaction(async (tx) => {
      await tx.clienteAnotacao.create({
        data: {
          empresaId: user.empresaId,
          clienteId: id,
          usuarioId: user.id,
          conteudo: dto.conteudo.trim(),
        },
      });
      await tx.clienteHistorico.create({
        data: {
          empresaId: user.empresaId,
          clienteId: id,
          usuarioId: user.id,
          acao: AcaoHistoricoCliente.ANOTACAO,
        },
      });
    });
    return this.findOne(user, id);
  }

  async addInteracao(user: AuthUser, id: number, dto: InteracaoClienteDto) {
    await this.ensureCliente(user, id, true);
    const propertyId = dto.propertyId ?? dto.imovelId ?? null;
    if (propertyId) await this.ensureProperty(user.empresaId, propertyId);

    await this.prisma.$transaction(async (tx) => {
      await tx.clienteInteracao.create({
        data: {
          empresaId: user.empresaId,
          clienteId: id,
          usuarioId: user.id,
          propertyId,
          tipo: dto.tipo,
          titulo: dto.titulo.trim(),
          descricao: this.normalizeOptionalText(dto.descricao),
          dataHora: dto.dataHora ? new Date(dto.dataHora) : new Date(),
        },
      });
      await tx.clienteHistorico.create({
        data: {
          empresaId: user.empresaId,
          clienteId: id,
          usuarioId: user.id,
          acao: AcaoHistoricoCliente.INTERACAO,
          alteracoes: { tipo: dto.tipo, titulo: dto.titulo },
        },
      });
    });
    return this.findOne(user, id);
  }

  async addFavorito(user: AuthUser, id: number, dto: FavoritoClienteDto) {
    await this.ensureCliente(user, id, true);
    const propertyId = dto.propertyId ?? dto.imovelId;
    if (!propertyId) {
      throw new BadRequestException('Informe o imóvel');
    }
    await this.ensureProperty(user.empresaId, propertyId);

    await this.prisma.$transaction(async (tx) => {
      await tx.clienteFavorito.upsert({
        where: {
          clienteId_propertyId: { clienteId: id, propertyId },
        },
        create: {
          empresaId: user.empresaId,
          clienteId: id,
          propertyId,
        },
        update: {},
      });
      await tx.clienteHistorico.create({
        data: {
          empresaId: user.empresaId,
          clienteId: id,
          usuarioId: user.id,
          acao: AcaoHistoricoCliente.FAVORITO_ADICIONADO,
          alteracoes: { propertyId },
        },
      });
    });
    return this.findOne(user, id);
  }

  async removeFavorito(user: AuthUser, id: number, imovelId: number) {
    await this.ensureCliente(user, id, true);
    const favorite = await this.prisma.clienteFavorito.findFirst({
      where: {
        empresaId: user.empresaId,
        clienteId: id,
        propertyId: imovelId,
      },
    });
    if (!favorite) throw new NotFoundException('Favorito não encontrado');

    await this.prisma.$transaction(async (tx) => {
      await tx.clienteFavorito.delete({ where: { id: favorite.id } });
      await tx.clienteHistorico.create({
        data: {
          empresaId: user.empresaId,
          clienteId: id,
          usuarioId: user.id,
          acao: AcaoHistoricoCliente.FAVORITO_REMOVIDO,
          alteracoes: { propertyId: imovelId },
        },
      });
    });
    return this.findOne(user, id);
  }

  async addVisita(user: AuthUser, id: number, dto: VisitaClienteDto) {
    await this.ensureCliente(user, id, true);
    const propertyId = dto.propertyId ?? dto.imovelId;
    if (!propertyId) throw new BadRequestException('Informe o imóvel');
    await this.ensureProperty(user.empresaId, propertyId);

    await this.prisma.$transaction(async (tx) => {
      await tx.clienteVisita.create({
        data: {
          empresaId: user.empresaId,
          clienteId: id,
          propertyId,
          usuarioId: user.id,
          dataHora: new Date(dto.dataHora),
          status: dto.status,
          observacoes: this.normalizeOptionalText(dto.observacoes),
        },
      });
      await tx.clienteHistorico.create({
        data: {
          empresaId: user.empresaId,
          clienteId: id,
          usuarioId: user.id,
          acao: AcaoHistoricoCliente.VISITA_REGISTRADA,
          alteracoes: { propertyId },
        },
      });
    });
    return this.findOne(user, id);
  }

  async addProposta(user: AuthUser, id: number, dto: PropostaClienteDto) {
    await this.ensureCliente(user, id, true);
    const propertyId = dto.propertyId ?? dto.imovelId;
    if (!propertyId) throw new BadRequestException('Informe o imóvel');
    await this.ensureProperty(user.empresaId, propertyId);

    await this.prisma.$transaction(async (tx) => {
      await tx.clienteProposta.create({
        data: {
          empresaId: user.empresaId,
          clienteId: id,
          propertyId,
          usuarioId: user.id,
          valor: dto.valor,
          status: dto.status,
          observacoes: this.normalizeOptionalText(dto.observacoes),
        },
      });
      await tx.clienteHistorico.create({
        data: {
          empresaId: user.empresaId,
          clienteId: id,
          usuarioId: user.id,
          acao: AcaoHistoricoCliente.PROPOSTA_REGISTRADA,
          alteracoes: { propertyId, valor: dto.valor },
        },
      });
    });
    return this.findOne(user, id);
  }

  async uploadAvatar(user: AuthUser, id: number) {
    const cliente = await this.ensureCliente(user, id, true);
    await this.prisma.clienteHistorico.create({
      data: {
        empresaId: user.empresaId,
        clienteId: id,
        usuarioId: user.id,
        acao: AcaoHistoricoCliente.AVATAR_ATUALIZADO,
      },
    });
    return this.findOne(user, id) ?? cliente;
  }

  async uploadDocumentos(
    user: AuthUser,
    id: number,
    files: Express.Multer.File[] | undefined,
    tipo?: string,
    nome?: string,
  ) {
    await this.ensureCliente(user, id, true);
    const docTipo = Object.values(TipoDocumentoCliente).includes(
      tipo as TipoDocumentoCliente,
    )
      ? (tipo as TipoDocumentoCliente)
      : TipoDocumentoCliente.OUTRO;

    const payloads =
      files && files.length > 0
        ? files.map((file, index) => ({
            empresaId: user.empresaId,
            clienteId: id,
            tipo: docTipo,
            nome: nome?.trim() || file.originalname || `Documento ${index + 1}`,
            nomeArquivo: file.originalname || `documento-${index + 1}`,
            mimeType: file.mimetype || 'application/octet-stream',
            tamanho: file.size || 0,
            url: `/uploads/clientes/${id}/${file.filename || `doc-${Date.now()}-${index}`}`,
          }))
        : [
            {
              empresaId: user.empresaId,
              clienteId: id,
              tipo: docTipo,
              nome: nome?.trim() || 'Documento',
              nomeArquivo: 'documento-stub.txt',
              mimeType: 'text/plain',
              tamanho: 0,
              url: `/uploads/clientes/${id}/stub.txt`,
            },
          ];

    await this.prisma.$transaction(async (tx) => {
      await tx.clienteDocumento.createMany({ data: payloads });
      await tx.clienteHistorico.create({
        data: {
          empresaId: user.empresaId,
          clienteId: id,
          usuarioId: user.id,
          acao: AcaoHistoricoCliente.DOCUMENTO_ADICIONADO,
          alteracoes: { quantidade: payloads.length },
        },
      });
    });
    return this.findOne(user, id);
  }

  async removeDocumento(user: AuthUser, id: number, docId: number) {
    await this.ensureCliente(user, id, true);
    const doc = await this.prisma.clienteDocumento.findFirst({
      where: { id: docId, clienteId: id, empresaId: user.empresaId },
    });
    if (!doc) throw new NotFoundException('Documento não encontrado');

    await this.prisma.$transaction(async (tx) => {
      await tx.clienteDocumento.delete({ where: { id: docId } });
      await tx.clienteHistorico.create({
        data: {
          empresaId: user.empresaId,
          clienteId: id,
          usuarioId: user.id,
          acao: AcaoHistoricoCliente.DOCUMENTO_REMOVIDO,
          alteracoes: { documentoId: docId, nome: doc.nome },
        },
      });
    });
    return this.findOne(user, id);
  }

  async share(user: AuthUser, id: number) {
    await this.ensureCliente(user, id, true);
    const token = `share-${id}-${user.empresaId}`;
    await this.prisma.clienteHistorico.create({
      data: {
        empresaId: user.empresaId,
        clienteId: id,
        usuarioId: user.id,
        acao: AcaoHistoricoCliente.COMPARTILHADO,
        alteracoes: { token },
      },
    });
    return {
      url: `/clientes/compartilhado/${token}`,
      token,
    };
  }

  async exportExcel(user: AuthUser, ativo = true) {
    const clientes = await this.prisma.cliente.findMany({
      where: {
        ...this.ownershipWhere(user),
        ativo,
        tipo: { not: TipoCliente.PROPRIETARIO },
      },
      orderBy: { nome: 'asc' },
      take: 5000,
    });

    const header = 'id;nome;email;telefone;cidade;status;tipo\n';
    const rows = clientes
      .map((item) =>
        [
          item.id,
          this.csv(item.nome),
          this.csv(item.email),
          this.csv(item.telefone),
          this.csv(item.cidade),
          item.status,
          item.tipo,
        ].join(';'),
      )
      .join('\n');
    return Buffer.from(`\uFEFF${header}${rows}`, 'utf8');
  }

  async exportPdf(user: AuthUser, id: number) {
    const cliente = await this.ensureCliente(user, id);
    const content = [
      '%PDF-1.1',
      '1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj',
      '2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj',
      '3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 144] /Contents 4 0 R /Resources<< /Font<< /F1 5 0 R >> >> >>endobj',
      `4 0 obj<< /Length 68 >>stream\nBT /F1 12 Tf 20 100 Td (${this.pdfEscape(cliente.nome)}) Tj ET\nendstream\nendobj`,
      '5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj',
      'xref\n0 6\n0000000000 65535 f \n',
      'trailer<< /Size 6 /Root 1 0 R >>\nstartxref\n0\n%%EOF',
    ].join('\n');
    return Buffer.from(content, 'utf8');
  }

  private ownershipWhere(user: AuthUser): Prisma.ClienteWhereInput {
    return {
      empresaId: user.empresaId,
      ...(user.perfil === UserProfile.CORRETOR ? { corretorId: user.id } : {}),
    };
  }

  private assertCorretorFilter(user: AuthUser, corretorId?: number) {
    if (
      user.perfil === UserProfile.CORRETOR &&
      corretorId &&
      corretorId !== user.id
    ) {
      throw new ForbiddenException(
        'Corretores só podem consultar a própria carteira',
      );
    }
  }

  private async ensureCliente(user: AuthUser, id: number, onlyActive = false) {
    const cliente = await this.prisma.cliente.findFirst({
      where: {
        id,
        ...this.ownershipWhere(user),
        ...(onlyActive ? { ativo: true } : {}),
      },
    });
    if (!cliente) throw new NotFoundException('Cliente não encontrado');
    return cliente;
  }

  private async ensureUsuario(empresaId: number, id: number) {
    const usuario = await this.prisma.usuario.findFirst({
      where: { id, empresaId, ativo: true },
      select: { id: true },
    });
    if (!usuario) {
      throw new BadRequestException('Corretor inválido para esta empresa');
    }
  }

  private async ensureProperty(empresaId: number, id: number) {
    const property = await this.prisma.property.findFirst({
      where: { id, empresaId, ativo: true },
      select: { id: true },
    });
    if (!property) throw new BadRequestException('Imóvel inválido');
  }

  private normalizeClienteData(
    dto: CreateClienteDto | UpdateClienteDto,
  ): NormalizedClienteData {
    const data: NormalizedClienteData = {};

    if (dto.tipo !== undefined) data.tipo = dto.tipo;
    if (dto.tipoPessoa !== undefined) data.tipoPessoa = dto.tipoPessoa;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.nome !== undefined) data.nome = dto.nome.trim();
    if (dto.razaoSocial !== undefined) {
      data.razaoSocial = this.normalizeOptionalText(dto.razaoSocial);
    }
    if (dto.nomeFantasia !== undefined) {
      data.nomeFantasia = this.normalizeOptionalText(dto.nomeFantasia);
    }
    if (dto.cpfCnpj !== undefined) {
      const digits = this.digits(dto.cpfCnpj);
      if (digits && ![11, 14].includes(digits.length)) {
        throw new BadRequestException('Informe um CPF ou CNPJ válido');
      }
      data.cpfCnpj = digits || null;
    }
    if (dto.email !== undefined) {
      data.email = this.normalizeOptionalText(dto.email)?.toLowerCase() ?? null;
    }
    if (dto.telefone !== undefined) {
      data.telefone = this.normalizeOptionalText(dto.telefone);
    }
    if (dto.whatsapp !== undefined) {
      data.whatsapp = this.normalizeOptionalText(dto.whatsapp);
    }
    if (dto.endereco !== undefined) {
      data.endereco = this.normalizeOptionalText(dto.endereco);
    }
    if (dto.cidade !== undefined) {
      data.cidade = this.normalizeOptionalText(dto.cidade);
    }
    if (dto.estado !== undefined) {
      const estado = this.normalizeOptionalText(dto.estado)?.toUpperCase();
      if (estado && estado.length !== 2) {
        throw new BadRequestException('Informe uma UF válida');
      }
      data.estado = estado ?? null;
    }
    if (dto.notas !== undefined) {
      data.notas = this.normalizeOptionalText(dto.notas);
    }
    if (dto.origem !== undefined) {
      data.origem = this.normalizeOptionalText(dto.origem);
    }
    if (dto.interesses !== undefined) data.interesses = dto.interesses;
    if (dto.faixaPrecoMin !== undefined) data.faixaPrecoMin = dto.faixaPrecoMin;
    if (dto.faixaPrecoMax !== undefined) data.faixaPrecoMax = dto.faixaPrecoMax;
    if (dto.cidadesInteresse !== undefined) {
      data.cidadesInteresse = dto.cidadesInteresse
        .map((item) => item.trim())
        .filter(Boolean);
    }
    if (dto.tags !== undefined) {
      data.tags = dto.tags.map((item) => item.trim()).filter(Boolean);
    }
    if (dto.corretorId !== undefined) data.corretorId = dto.corretorId;

    return data;
  }

  private validatePriceRange(min?: number | null, max?: number | null) {
    if (min != null && max != null && max < min) {
      throw new BadRequestException(
        'A faixa máxima deve ser maior ou igual à mínima',
      );
    }
  }

  private mapListCliente(
    cliente: Prisma.ClienteGetPayload<{ include: typeof listInclude }>,
  ) {
    return {
      ...cliente,
      telefones: cliente.telefone
        ? [
            {
              id: 1,
              numero: cliente.telefone,
              tipo: 'CELULAR',
              principal: true,
            },
          ]
        : [],
      emails: cliente.email
        ? [
            {
              id: 1,
              email: cliente.email,
              tipo: 'OUTRO',
              principal: true,
            },
          ]
        : [],
    };
  }

  private mapDetailCliente(
    cliente: Prisma.ClienteGetPayload<{ include: typeof detailInclude }>,
  ) {
    const { interacoes, favoritos, visitas, propostas, ...rest } = cliente;

    return {
      ...rest,
      tokenCompartilhamento: null,
      telefones: cliente.telefone
        ? [
            {
              id: 1,
              numero: cliente.telefone,
              tipo: 'CELULAR',
              principal: true,
            },
          ]
        : [],
      emails: cliente.email
        ? [
            {
              id: 1,
              email: cliente.email,
              tipo: 'OUTRO',
              principal: true,
            },
          ]
        : [],
      enderecos:
        cliente.endereco || cliente.cidade
          ? [
              {
                id: 1,
                tipo: 'RESIDENCIAL',
                logradouro: cliente.endereco || '',
                numero: '',
                complemento: '',
                bairro: '',
                cidade: cliente.cidade || '',
                estado: cliente.estado || '',
                cep: '',
                principal: true,
              },
            ]
          : [],
      interacoes: interacoes.map((item) => ({
        ...item,
        imovelId: item.propertyId,
        imovel: item.property
          ? {
              id: item.property.id,
              codigo: item.property.codigo,
              titulo: item.property.titulo,
            }
          : null,
      })),
      favoritos: favoritos.map((item) => ({
        ...item,
        imovelId: item.propertyId,
        imovel: item.property
          ? {
              ...item.property,
              valorAluguel: item.property.valorLocacao,
            }
          : null,
      })),
      visitas: visitas.map((item) => ({
        ...item,
        imovelId: item.propertyId,
        imovel: item.property,
      })),
      propostas: propostas.map((item) => ({
        ...item,
        imovelId: item.propertyId,
        imovel: item.property,
      })),
      imoveisProprietario: [],
    };
  }

  private normalizeOptionalText(value?: string | null) {
    if (value == null) return null;
    const trimmed = String(value).trim();
    return trimmed || null;
  }

  private digits(value?: string | null) {
    return (value ?? '').replace(/\D/g, '');
  }

  private csv(value?: string | null) {
    return `"${String(value ?? '').replace(/"/g, '""')}"`;
  }

  private pdfEscape(value: string) {
    return value.replace(/[()\\]/g, '\\$&').slice(0, 80);
  }
}
