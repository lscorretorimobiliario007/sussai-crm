import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma, UserProfile } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import type { AuthUser } from '../auth/types/auth-user.type';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: AuthUser, data: CreateUserDto) {
    const email = data.email.trim().toLowerCase();
    const senhaCriptografada = await bcrypt.hash(data.senha, 12);

    try {
      const usuario = await this.prisma.usuario.create({
        data: {
          nome: data.nome.trim(),
          email,
          senha: senhaCriptografada,
          // Always scope to the authenticated admin's tenant (ignore client-supplied empresaId)
          empresaId: user.empresaId,
          perfil: data.perfil ?? UserProfile.CORRETOR,
        },
        select: {
          id: true,
          nome: true,
          email: true,
          perfil: true,
          ativo: true,
          empresaId: true,
          createdAt: true,
        },
      });

      return usuario;
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
}
