import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma, UserProfile } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PipelineService } from '../pipeline/pipeline.service';
import type { AuthUser, JwtPayload } from './types/auth-user.type';
import { CreateAuthUserDto } from './dto/create-auth-user.dto';
import { RegistrarDto } from './dto/registrar.dto';

const DEMO_EMAIL = 'demo@sussai.com.br';
const DEMO_PASSWORD = '123456';
const DEMO_EMPRESA_EMAIL = 'empresa.demo@sussai.com.br';
const DEMO_CNPJ = '00000000000191';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
    private readonly pipelineService: PipelineService,
  ) {}

  private async issueAuthResponse(
    usuarioId: number,
    extras: Record<string, unknown> = {},
  ) {
    const usuario = await this.prisma.usuario.findFirst({
      where: { id: usuarioId, ativo: true },
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true,
        empresaId: true,
        empresa: {
          select: {
            id: true,
            nome: true,
            nomeFantasia: true,
            plano: true,
            ativo: true,
          },
        },
      },
    });

    if (!usuario || !usuario.empresa.ativo) {
      throw new UnauthorizedException('Usuário ou empresa inativos');
    }

    const payload: JwtPayload = {
      id: usuario.id,
      empresaId: usuario.empresaId,
      perfil: usuario.perfil,
      email: usuario.email,
    };

    const access_token = await this.jwtService.signAsync(payload);

    return {
      access_token,
      token: access_token,
      token_type: 'Bearer',
      expires_in: process.env.JWT_EXPIRES_IN || '1d',
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
        tipo: usuario.perfil,
        empresaId: usuario.empresaId,
        empresaNome: usuario.empresa.nomeFantasia || usuario.empresa.nome,
        plano: usuario.empresa.plano,
        empresa: usuario.empresa,
        demo: usuario.email === DEMO_EMAIL,
      },
      ...extras,
    };
  }

  async login(email: string, senha: string) {
    const normalizedEmail = email.trim().toLowerCase();

    const usuario = await this.prisma.usuario.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        senha: true,
        ativo: true,
        empresa: { select: { ativo: true } },
      },
    });

    if (!usuario || !usuario.ativo) {
      throw new UnauthorizedException('E-mail ou senha inválidos');
    }

    if (!usuario.empresa.ativo) {
      throw new ForbiddenException(
        'Empresa inativa. Entre em contato com o suporte.',
      );
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      throw new UnauthorizedException('E-mail ou senha inválidos');
    }

    return this.issueAuthResponse(usuario.id, {
      mensagem: 'Login realizado com sucesso',
    });
  }

  async registrar(dto: RegistrarDto) {
    if (process.env.ALLOW_PUBLIC_SIGNUP === 'false') {
      throw new ForbiddenException(
        'Cadastro público desabilitado. Contate o administrador.',
      );
    }

    const email = dto.email.trim().toLowerCase();
    const empresaEmail = dto.empresaEmail.trim().toLowerCase();
    const cnpjDigits = (dto.empresaCnpj || '').replace(/\D/g, '');
    const cnpj =
      cnpjDigits.length >= 11
        ? cnpjDigits
        : `9${Date.now().toString().slice(-13)}`.padEnd(14, '0').slice(0, 14);

    const senhaHash = await bcrypt.hash(dto.senha, 12);

    try {
      const resultado = await this.prisma.$transaction(async (tx) => {
        const empresa = await tx.empresa.create({
          data: {
            nome: dto.empresaNome.trim(),
            cnpj,
            email: empresaEmail,
            telefone: dto.empresaTelefone?.trim() || null,
            plano: 'STARTER',
            ativo: true,
          },
        });

        const usuario = await tx.usuario.create({
          data: {
            empresaId: empresa.id,
            nome: dto.nome.trim(),
            email,
            senha: senhaHash,
            perfil: UserProfile.ADMIN,
            ativo: true,
          },
        });

        return { empresa, usuario };
      });

      await this.pipelineService.ensureDefaultStages(resultado.empresa.id);

      return this.issueAuthResponse(resultado.usuario.id, {
        mensagem: 'Empresa registrada com sucesso!',
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('E-mail ou CNPJ já cadastrado');
      }
      throw error;
    }
  }

  async entrarDemo({ reset = false }: { reset?: boolean } = {}) {
    if (
      process.env.NODE_ENV === 'production' &&
      process.env.ALLOW_DEMO !== 'true'
    ) {
      throw new ForbiddenException(
        'Modo demonstração desabilitado em produção',
      );
    }

    const senhaHash = await bcrypt.hash(DEMO_PASSWORD, 12);

    let empresa = await this.prisma.empresa.findFirst({
      where: { email: DEMO_EMPRESA_EMAIL },
    });

    if (!empresa) {
      empresa = await this.prisma.empresa.create({
        data: {
          nome: 'SUSSAI Demonstração',
          nomeFantasia: 'SUSSAI Demo',
          cnpj: DEMO_CNPJ,
          email: DEMO_EMPRESA_EMAIL,
          telefone: '(11) 3000-0000',
          plano: 'PROFESSIONAL',
          ativo: true,
        },
      });
    }

    let admin = await this.prisma.usuario.findUnique({
      where: { email: DEMO_EMAIL },
    });

    if (!admin) {
      admin = await this.prisma.usuario.create({
        data: {
          empresaId: empresa.id,
          nome: 'Usuário Demo',
          email: DEMO_EMAIL,
          senha: senhaHash,
          perfil: UserProfile.ADMIN,
          ativo: true,
        },
      });
    } else if (reset || admin.empresaId !== empresa.id || !admin.ativo) {
      admin = await this.prisma.usuario.update({
        where: { id: admin.id },
        data: {
          empresaId: empresa.id,
          senha: senhaHash,
          perfil: UserProfile.ADMIN,
          ativo: true,
          nome: 'Usuário Demo',
        },
      });
    }

    await this.pipelineService.ensureDefaultStages(empresa.id);

    return this.issueAuthResponse(admin.id, {
      mensagem: reset
        ? 'Dados de demonstração reiniciados com sucesso'
        : 'Ambiente de demonstração pronto',
      demo: true,
      reset,
    });
  }

  async me(userId: number): Promise<
    AuthUser & {
      ativo: boolean;
      tipo: UserProfile;
      empresa: {
        id: number;
        nome: string;
        nomeFantasia: string | null;
        plano: string;
      };
      createdAt: Date;
    }
  > {
    const usuario = await this.prisma.usuario.findFirst({
      where: {
        id: userId,
        ativo: true,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true,
        ativo: true,
        empresaId: true,
        createdAt: true,
        empresa: {
          select: {
            id: true,
            nome: true,
            nomeFantasia: true,
            plano: true,
          },
        },
      },
    });

    if (!usuario) {
      throw new UnauthorizedException('Usuário não autenticado ou inativo');
    }

    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
      tipo: usuario.perfil,
      empresaId: usuario.empresaId,
      ativo: usuario.ativo,
      empresa: usuario.empresa,
      createdAt: usuario.createdAt,
    };
  }

  async refresh(userId: number) {
    return this.issueAuthResponse(userId, {
      mensagem: 'Token renovado com sucesso',
    });
  }

  async listUsuarios(user: AuthUser) {
    if (
      !([UserProfile.ADMIN, UserProfile.GERENTE] as UserProfile[]).includes(
        user.perfil,
      )
    ) {
      throw new ForbiddenException('Sem permissão para listar usuários');
    }

    const usuarios = await this.prisma.usuario.findMany({
      where: { empresaId: user.empresaId },
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true,
        telefone: true,
        ativo: true,
        createdAt: true,
      },
      orderBy: { nome: 'asc' },
      take: 500,
    });

    return usuarios.map((item) => ({
      ...item,
      tipo: item.perfil,
    }));
  }

  async createUsuario(user: AuthUser, dto: CreateAuthUserDto) {
    if (user.perfil !== UserProfile.ADMIN) {
      throw new ForbiddenException(
        'Apenas administradores podem criar usuários',
      );
    }

    const perfil = dto.tipo ?? dto.perfil ?? UserProfile.CORRETOR;
    const email = dto.email.trim().toLowerCase();
    const senhaHash = await bcrypt.hash(dto.senha, 12);

    try {
      const usuario = await this.prisma.usuario.create({
        data: {
          empresaId: user.empresaId,
          nome: dto.nome.trim(),
          email,
          senha: senhaHash,
          perfil,
          telefone: dto.telefone?.trim() || null,
        },
        select: {
          id: true,
          nome: true,
          email: true,
          perfil: true,
          telefone: true,
          ativo: true,
          createdAt: true,
        },
      });

      await this.auditService.logAudit(user, 'CREATE', 'Usuario', usuario.id, {
        email,
        perfil,
      });

      return { ...usuario, tipo: usuario.perfil };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('E-mail já cadastrado');
      }
      throw error;
    }
  }

  async validateUserById(userId: number): Promise<AuthUser> {
    const usuario = await this.prisma.usuario.findFirst({
      where: {
        id: userId,
        ativo: true,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true,
        empresaId: true,
      },
    });

    if (!usuario) {
      throw new UnauthorizedException('Token inválido ou usuário inativo');
    }

    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
      empresaId: usuario.empresaId,
    };
  }
}
