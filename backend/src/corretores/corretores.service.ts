import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AcaoHistoricoCorretor,
  LeadStatus,
  Prisma,
  StatusContrato,
  StatusCorretor,
  TipoContrato,
  UserProfile,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { AuthUser } from '../auth/types/auth-user.type';
import { CreateCorretorDto } from './dto/create-corretor.dto';
import { UpdateCorretorDto } from './dto/update-corretor.dto';
import { QueryCorretorDto } from './dto/query-corretor.dto';
import { CreateEquipeDto } from './dto/create-equipe.dto';

const PERMISSOES = [
  'imoveis',
  'clientes',
  'proprietarios',
  'leads',
  'agenda',
  'contratos',
  'tarefas',
];

const CORRETOR_PROFILES: UserProfile[] = [
  UserProfile.CORRETOR,
  UserProfile.GERENTE,
  UserProfile.ADMIN,
];

@Injectable()
export class CorretoresService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  private assertCanManage(user: AuthUser) {
    if (
      !([UserProfile.ADMIN, UserProfile.GERENTE] as UserProfile[]).includes(
        user.perfil,
      )
    ) {
      throw new ForbiddenException('Sem permissão para gerenciar corretores');
    }
  }

  private sanitize(
    usuario: Record<string, unknown> & { senha?: string; perfil: UserProfile },
  ) {
    const { senha, ...rest } = usuario;
    void senha;
    return {
      ...rest,
      tipo: rest.perfil,
    };
  }

  private listInclude() {
    return {
      equipe: { select: { id: true, nome: true } },
      _count: {
        select: {
          leadsAssigned: true,
          contratosCorretor: true,
          eventosResponsavel: true,
          clientesCorretor: true,
        },
      },
    } satisfies Prisma.UsuarioInclude;
  }

  async opcoes(empresaId: number) {
    const equipes = await this.prisma.corretorEquipe.findMany({
      where: { empresaId, ativo: true },
      orderBy: { nome: 'asc' },
    });
    return {
      equipes,
      status: Object.values(StatusCorretor),
      tipos: Object.values(UserProfile),
      permissoes: PERMISSOES,
    };
  }

  async createEquipe(user: AuthUser, dto: CreateEquipeDto) {
    this.assertCanManage(user);
    const nome = dto.nome.trim();
    if (!nome) {
      throw new BadRequestException('Nome da equipe é obrigatório');
    }
    const equipe = await this.prisma.corretorEquipe.create({
      data: { empresaId: user.empresaId, nome },
    });
    await this.auditService.logAudit(
      user,
      'CREATE',
      'CorretorEquipe',
      equipe.id,
      {
        nome,
      },
    );
    return equipe;
  }

  async indicadores(empresaId: number, usuarioId: number) {
    const now = new Date();
    const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);
    const fimMes = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    const [
      usuario,
      captacoes,
      vendasMes,
      contratosAtivos,
      leadsAbertos,
      leadsGanhos,
      leadsPerdidos,
      agendaMes,
    ] = await Promise.all([
      this.prisma.usuario.findFirst({
        where: { id: usuarioId, empresaId },
        select: { comissaoPadrao: true, metaMensal: true },
      }),
      this.prisma.cliente.count({
        where: { empresaId, corretorId: usuarioId, ativo: true },
      }),
      this.prisma.contrato.findMany({
        where: {
          empresaId,
          corretorId: usuarioId,
          tipo: TipoContrato.VENDA,
          status: { in: [StatusContrato.ATIVO, StatusContrato.ENCERRADO] },
          OR: [
            { dataInicio: { gte: inicioMes, lte: fimMes } },
            { createdAt: { gte: inicioMes, lte: fimMes } },
          ],
        },
        select: { valor: true },
      }),
      this.prisma.contrato.count({
        where: {
          empresaId,
          corretorId: usuarioId,
          status: StatusContrato.ATIVO,
        },
      }),
      this.prisma.lead.count({
        where: {
          empresaId,
          assignedUserId: usuarioId,
          ativo: true,
          status: { notIn: [LeadStatus.FECHADO, LeadStatus.PERDIDO] },
        },
      }),
      this.prisma.lead.count({
        where: {
          empresaId,
          assignedUserId: usuarioId,
          ativo: true,
          status: LeadStatus.FECHADO,
        },
      }),
      this.prisma.lead.count({
        where: {
          empresaId,
          assignedUserId: usuarioId,
          ativo: true,
          status: LeadStatus.PERDIDO,
        },
      }),
      this.prisma.eventoAgenda.count({
        where: {
          empresaId,
          usuarioId,
          ativo: true,
          inicio: { gte: inicioMes, lte: fimMes },
        },
      }),
    ]);

    const valorVendas = vendasMes.reduce(
      (sum, item) => sum + (item.valor || 0),
      0,
    );
    const comissaoPrevista =
      valorVendas * ((usuario?.comissaoPadrao || 0) / 100);
    const fechados = leadsGanhos + leadsPerdidos;
    const conversao =
      fechados > 0 ? Math.round((leadsGanhos / fechados) * 100) : 0;
    const meta = usuario?.metaMensal || 0;
    const progressoMeta =
      meta > 0 ? Math.min(100, Math.round((valorVendas / meta) * 100)) : null;

    return {
      captacoes,
      vendasMes: vendasMes.length,
      valorVendasMes: valorVendas,
      comissaoPrevista,
      contratosAtivos,
      leadsAbertos,
      leadsGanhos,
      leadsPerdidos,
      conversao,
      metaMensal: meta,
      progressoMeta,
      agendaMes,
    };
  }

  private async rankingRows(user: AuthUser) {
    const where: Prisma.UsuarioWhereInput = {
      empresaId: user.empresaId,
      perfil: { in: [UserProfile.CORRETOR, UserProfile.GERENTE] },
      ativo: true,
      ...(user.perfil === UserProfile.CORRETOR ? { id: user.id } : {}),
    };

    const corretores = await this.prisma.usuario.findMany({
      where,
      select: {
        id: true,
        nome: true,
        fotoUrl: true,
        creci: true,
        statusCorretor: true,
        metaMensal: true,
        comissaoPadrao: true,
        perfil: true,
        equipe: { select: { id: true, nome: true } },
      },
      orderBy: { nome: 'asc' },
    });

    const ranked = await Promise.all(
      corretores.map(async (corretor) => ({
        ...corretor,
        tipo: corretor.perfil,
        indicadores: await this.indicadores(user.empresaId, corretor.id),
      })),
    );

    ranked.sort(
      (a, b) =>
        (b.indicadores.valorVendasMes || 0) -
        (a.indicadores.valorVendasMes || 0),
    );
    return ranked;
  }

  async ranking(user: AuthUser) {
    const ranked = await this.rankingRows(user);
    return {
      data: ranked.map((item, index) => ({ ...item, posicao: index + 1 })),
    };
  }

  async dashboard(user: AuthUser) {
    const where: Prisma.UsuarioWhereInput = {
      empresaId: user.empresaId,
      perfil: { in: [UserProfile.CORRETOR, UserProfile.GERENTE] },
      ...(user.perfil === UserProfile.CORRETOR ? { id: user.id } : {}),
    };

    const [total, ativos, ferias, inativos] = await Promise.all([
      this.prisma.usuario.count({ where }),
      this.prisma.usuario.count({
        where: { ...where, statusCorretor: StatusCorretor.ATIVO, ativo: true },
      }),
      this.prisma.usuario.count({
        where: { ...where, statusCorretor: StatusCorretor.FERIAS },
      }),
      this.prisma.usuario.count({
        where: { ...where, statusCorretor: StatusCorretor.INATIVO },
      }),
    ]);

    const ranked = await this.rankingRows(user);
    return {
      resumo: { total, ativos, ferias, inativos },
      destaque: ranked[0] ? { ...ranked[0], posicao: 1 } : null,
    };
  }

  async findAll(user: AuthUser, query: QueryCorretorDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const busca = query.busca?.trim();

    const where: Prisma.UsuarioWhereInput = {
      empresaId: user.empresaId,
      perfil: { in: CORRETOR_PROFILES },
      ...(user.perfil === UserProfile.CORRETOR ? { id: user.id } : {}),
      ...(query.statusCorretor ? { statusCorretor: query.statusCorretor } : {}),
      ...(query.equipeId ? { equipeId: query.equipeId } : {}),
      ...(query.ativo === 'false'
        ? { ativo: false }
        : query.ativo === 'true'
          ? { ativo: true }
          : {}),
      ...(busca
        ? {
            OR: [
              { nome: { contains: busca, mode: 'insensitive' } },
              { email: { contains: busca, mode: 'insensitive' } },
              { creci: { contains: busca, mode: 'insensitive' } },
              { telefone: { contains: busca, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.usuario.findMany({
        where,
        include: this.listInclude(),
        orderBy: { nome: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.usuario.count({ where }),
    ]);

    const data = await Promise.all(
      rows.map(async (usuario) => ({
        ...this.sanitize(usuario),
        indicadores: await this.indicadores(user.empresaId, usuario.id),
      })),
    );

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

  async findOne(user: AuthUser, id: number) {
    if (user.perfil === UserProfile.CORRETOR && user.id !== id) {
      throw new ForbiddenException('Corretores só podem ver o próprio perfil');
    }

    const usuario = await this.prisma.usuario.findFirst({
      where: { id, empresaId: user.empresaId },
      include: {
        ...this.listInclude(),
        corretorHistoricoAlvo: {
          orderBy: { createdAt: 'desc' },
          take: 30,
          include: { autor: { select: { id: true, nome: true } } },
        },
        leadsAssigned: {
          where: { ativo: true },
          orderBy: { updatedAt: 'desc' },
          take: 20,
          include: {
            stage: { select: { id: true, nome: true, cor: true } },
          },
        },
        eventosResponsavel: {
          where: { ativo: true, inicio: { gte: new Date() } },
          orderBy: { inicio: 'asc' },
          take: 15,
        },
        contratosCorretor: {
          where: { ativo: true },
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            property: {
              select: {
                id: true,
                codigo: true,
                titulo: true,
                cidade: true,
                valorVenda: true,
                valorLocacao: true,
                ativo: true,
              },
            },
          },
        },
      },
    });

    if (!usuario) {
      throw new NotFoundException('Corretor não encontrado');
    }

    const indicadores = await this.indicadores(user.empresaId, usuario.id);
    const imoveisCorretados = usuario.contratosCorretor
      .map((c) => c.property)
      .filter(Boolean)
      .map((imovel) => ({
        id: imovel.id,
        codigo: imovel.codigo,
        titulo: imovel.titulo,
        status: imovel.ativo ? 'ATIVO' : 'INATIVO',
        cidade: imovel.cidade,
        valorVenda: imovel.valorVenda,
        valorAluguel: imovel.valorLocacao,
      }));

    const {
      contratosCorretor,
      leadsAssigned,
      eventosResponsavel,
      corretorHistoricoAlvo,
      ...rest
    } = usuario;
    void contratosCorretor;

    return {
      ...this.sanitize(rest),
      indicadores,
      leads: leadsAssigned.map((lead) => ({
        ...lead,
        titulo: lead.nome,
        etapa: lead.stage,
      })),
      eventosAgenda: eventosResponsavel.map((evento) => ({
        ...evento,
        dataInicio: evento.inicio,
      })),
      historicosCorretor: corretorHistoricoAlvo,
      imoveisCorretados,
    };
  }

  private resolvePerfil(dto: { tipo?: UserProfile; perfil?: UserProfile }) {
    return dto.tipo ?? dto.perfil ?? UserProfile.CORRETOR;
  }

  private validatePermissoes(permissoes?: string[]) {
    if (permissoes == null) return;
    if (
      !Array.isArray(permissoes) ||
      permissoes.some((item) => !PERMISSOES.includes(item))
    ) {
      throw new BadRequestException('Permissões inválidas');
    }
  }

  async create(user: AuthUser, dto: CreateCorretorDto) {
    this.assertCanManage(user);
    const perfil = this.resolvePerfil(dto);
    if (user.perfil === UserProfile.GERENTE && perfil === UserProfile.ADMIN) {
      throw new ForbiddenException('Gerentes não podem criar administradores');
    }
    this.validatePermissoes(dto.permissoes);

    if (dto.equipeId) {
      const equipe = await this.prisma.corretorEquipe.findFirst({
        where: { id: dto.equipeId, empresaId: user.empresaId, ativo: true },
      });
      if (!equipe) throw new BadRequestException('Equipe inválida');
    }

    const email = dto.email.trim().toLowerCase();
    const senha = await bcrypt.hash(dto.senha, 12);
    const statusCorretor = dto.statusCorretor ?? StatusCorretor.ATIVO;

    try {
      const created = await this.prisma.$transaction(async (tx) => {
        const usuario = await tx.usuario.create({
          data: {
            nome: dto.nome.trim(),
            email,
            senha,
            telefone: dto.telefone?.trim() || null,
            perfil,
            creci: dto.creci?.trim() || null,
            crea: dto.crea?.trim() || null,
            comissaoPadrao: dto.comissaoPadrao ?? 5,
            metaMensal: dto.metaMensal ?? null,
            statusCorretor,
            equipeId: dto.equipeId ?? null,
            permissoes: dto.permissoes ?? [
              'imoveis',
              'clientes',
              'leads',
              'agenda',
              'tarefas',
            ],
            ativo: statusCorretor !== StatusCorretor.INATIVO,
            empresaId: user.empresaId,
          },
          include: this.listInclude(),
        });

        await tx.corretorHistorico.create({
          data: {
            empresaId: user.empresaId,
            usuarioId: usuario.id,
            autorId: user.id,
            acao: AcaoHistoricoCorretor.CRIADO,
            alteracoes: { nome: usuario.nome, tipo: usuario.perfil },
          },
        });

        return usuario;
      });

      await this.auditService.logAudit(user, 'CREATE', 'Corretor', created.id, {
        email,
        perfil,
      });

      return this.sanitize(created);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Já existe um usuário com este e-mail');
      }
      throw error;
    }
  }

  async update(user: AuthUser, id: number, dto: UpdateCorretorDto) {
    if (user.perfil === UserProfile.CORRETOR && user.id !== id) {
      throw new ForbiddenException('Sem permissão para editar outro corretor');
    }

    const previous = await this.prisma.usuario.findFirst({
      where: { id, empresaId: user.empresaId },
    });
    if (!previous) {
      throw new NotFoundException('Corretor não encontrado');
    }

    if (
      user.perfil === UserProfile.GERENTE &&
      previous.perfil === UserProfile.ADMIN
    ) {
      throw new ForbiddenException('Gerentes não podem editar administradores');
    }

    const perfil =
      dto.tipo !== undefined || dto.perfil !== undefined
        ? this.resolvePerfil(dto)
        : undefined;

    if (user.perfil === UserProfile.GERENTE && perfil === UserProfile.ADMIN) {
      throw new ForbiddenException(
        'Gerentes não podem promover administradores',
      );
    }

    this.validatePermissoes(dto.permissoes);

    if (user.perfil === UserProfile.CORRETOR) {
      delete dto.tipo;
      delete dto.perfil;
      delete dto.permissoes;
      delete dto.comissaoPadrao;
      delete dto.metaMensal;
      delete dto.statusCorretor;
      delete dto.equipeId;
    }

    const data: Prisma.UsuarioUpdateInput = {
      ...(dto.nome !== undefined && { nome: dto.nome.trim() }),
      ...(dto.email !== undefined && { email: dto.email.trim().toLowerCase() }),
      ...(dto.telefone !== undefined && {
        telefone: dto.telefone?.trim() || null,
      }),
      ...(perfil !== undefined && { perfil }),
      ...(dto.creci !== undefined && { creci: dto.creci?.trim() || null }),
      ...(dto.crea !== undefined && { crea: dto.crea?.trim() || null }),
      ...(dto.comissaoPadrao !== undefined && {
        comissaoPadrao: dto.comissaoPadrao,
      }),
      ...(dto.metaMensal !== undefined && { metaMensal: dto.metaMensal }),
      ...(dto.statusCorretor !== undefined && {
        statusCorretor: dto.statusCorretor,
        ativo: dto.statusCorretor !== StatusCorretor.INATIVO,
      }),
      ...(dto.equipeId !== undefined && {
        equipe: dto.equipeId
          ? { connect: { id: dto.equipeId } }
          : { disconnect: true },
      }),
      ...(dto.permissoes !== undefined && { permissoes: dto.permissoes }),
    };

    if (dto.senha) {
      data.senha = await bcrypt.hash(dto.senha, 12);
    }

    let acao: AcaoHistoricoCorretor = AcaoHistoricoCorretor.ATUALIZADO;
    if (dto.statusCorretor && dto.statusCorretor !== previous.statusCorretor) {
      acao = AcaoHistoricoCorretor.STATUS_ALTERADO;
    }
    if (dto.metaMensal != null && dto.metaMensal !== previous.metaMensal) {
      acao = AcaoHistoricoCorretor.META_ATUALIZADA;
    }
    if (dto.equipeId !== undefined && dto.equipeId !== previous.equipeId) {
      acao = AcaoHistoricoCorretor.EQUIPE_ALTERADA;
    }

    try {
      const updated = await this.prisma.$transaction(async (tx) => {
        const usuario = await tx.usuario.update({
          where: { id: previous.id },
          data,
          include: this.listInclude(),
        });
        await tx.corretorHistorico.create({
          data: {
            empresaId: user.empresaId,
            usuarioId: previous.id,
            autorId: user.id,
            acao,
            alteracoes: dto.senha
              ? { ...dto, senha: '[alterada]' }
              : (dto as unknown as Prisma.InputJsonValue),
          },
        });
        return usuario;
      });

      await this.auditService.logAudit(user, 'UPDATE', 'Corretor', id, {
        acao,
      });

      return this.sanitize(updated);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Já existe um usuário com este e-mail');
      }
      throw error;
    }
  }

  async uploadFoto(user: AuthUser, id: number, file?: Express.Multer.File) {
    if (user.perfil === UserProfile.CORRETOR && user.id !== id) {
      throw new ForbiddenException('Sem permissão');
    }
    if (!file) {
      throw new BadRequestException('Selecione uma foto');
    }

    const previous = await this.prisma.usuario.findFirst({
      where: { id, empresaId: user.empresaId },
      select: { id: true },
    });
    if (!previous) {
      throw new NotFoundException('Corretor não encontrado');
    }

    const fotoUrl = `/uploads/corretores/${user.empresaId}/${id}/${file.filename}`;

    const updated = await this.prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.update({
        where: { id },
        data: { fotoUrl },
        include: this.listInclude(),
      });
      await tx.corretorHistorico.create({
        data: {
          empresaId: user.empresaId,
          usuarioId: id,
          autorId: user.id,
          acao: AcaoHistoricoCorretor.FOTO_ATUALIZADA,
        },
      });
      return usuario;
    });

    return this.sanitize(updated);
  }
}
