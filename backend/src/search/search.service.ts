import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(empresaId: number, q?: string) {
    const term = q?.trim();
    if (!term || term.length < 2) {
      return {
        q: term || '',
        properties: [],
        clients: [],
        leads: [],
        owners: [],
      };
    }

    const [properties, clients, leads, owners] = await Promise.all([
      this.prisma.property.findMany({
        where: {
          empresaId,
          OR: [
            { codigo: { contains: term, mode: 'insensitive' } },
            { titulo: { contains: term, mode: 'insensitive' } },
            { bairro: { contains: term, mode: 'insensitive' } },
            { cidade: { contains: term, mode: 'insensitive' } },
            { endereco: { contains: term, mode: 'insensitive' } },
          ],
        },
        take: 10,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          codigo: true,
          titulo: true,
          cidade: true,
          bairro: true,
          finalidade: true,
          tipo: true,
        },
      }),
      this.prisma.cliente.findMany({
        where: {
          empresaId,
          ativo: true,
          OR: [
            { nome: { contains: term, mode: 'insensitive' } },
            { email: { contains: term, mode: 'insensitive' } },
            { telefone: { contains: term, mode: 'insensitive' } },
            { cpfCnpj: { contains: term, mode: 'insensitive' } },
          ],
        },
        take: 10,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          nome: true,
          email: true,
          telefone: true,
          tipo: true,
          status: true,
        },
      }),
      this.prisma.lead.findMany({
        where: {
          empresaId,
          ativo: true,
          OR: [
            { nome: { contains: term, mode: 'insensitive' } },
            { email: { contains: term, mode: 'insensitive' } },
            { telefone: { contains: term, mode: 'insensitive' } },
          ],
        },
        take: 10,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          nome: true,
          email: true,
          telefone: true,
          status: true,
          origem: true,
        },
      }),
      this.prisma.propertyOwner.findMany({
        where: {
          empresaId,
          ativo: true,
          OR: [
            { nome: { contains: term, mode: 'insensitive' } },
            { email: { contains: term, mode: 'insensitive' } },
            { telefone: { contains: term, mode: 'insensitive' } },
            { cpf: { contains: term, mode: 'insensitive' } },
            { cnpj: { contains: term, mode: 'insensitive' } },
          ],
        },
        take: 10,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          nome: true,
          email: true,
          telefone: true,
          cidade: true,
        },
      }),
    ]);

    return { q: term, properties, clients, leads, owners };
  }
}
