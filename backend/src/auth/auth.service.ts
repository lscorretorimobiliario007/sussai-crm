import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser, JwtPayload } from './types/auth-user.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, senha: string) {
    const normalizedEmail = email.trim().toLowerCase();

    const usuario = await this.prisma.usuario.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        nome: true,
        email: true,
        senha: true,
        perfil: true,
        ativo: true,
        empresaId: true,
        empresa: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });

    if (!usuario || !usuario.ativo) {
      throw new UnauthorizedException('E-mail ou senha inválidos');
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      throw new UnauthorizedException('E-mail ou senha inválidos');
    }

    const payload: JwtPayload = {
      id: usuario.id,
      empresaId: usuario.empresaId,
      perfil: usuario.perfil,
      email: usuario.email,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      token_type: 'Bearer',
      expires_in: process.env.JWT_EXPIRES_IN || '1d',
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
        empresaId: usuario.empresaId,
        empresa: usuario.empresa,
      },
    };
  }

  async me(userId: number): Promise<AuthUser & {
    ativo: boolean;
    empresa: { id: number; nome: string };
    createdAt: Date;
  }> {
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
      empresaId: usuario.empresaId,
      ativo: usuario.ativo,
      empresa: usuario.empresa,
      createdAt: usuario.createdAt,
    };
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
