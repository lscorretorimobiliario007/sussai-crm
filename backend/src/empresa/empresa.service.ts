import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserProfile } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { AuthUser } from '../auth/types/auth-user.type';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';

@Injectable()
export class EmpresaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  sanitize(empresa: Record<string, unknown>) {
    return {
      id: empresa.id,
      nome: empresa.nome,
      nomeFantasia: empresa.nomeFantasia,
      razaoSocial: empresa.razaoSocial,
      cnpj: empresa.cnpj,
      creci: empresa.creci ?? null,
      email: empresa.email,
      telefone: empresa.telefone,
      whatsapp: empresa.whatsapp,
      siteUrl: empresa.siteUrl,
      slogan: empresa.slogan ?? null,
      logoUrl: empresa.logoUrl,
      faviconUrl: empresa.faviconUrl ?? null,
      corPrimaria: (empresa.corPrimaria as string) || '#0B1F3A',
      corSecundaria: (empresa.corSecundaria as string) || '#C9A227',
      endereco: empresa.endereco,
      numero: empresa.numero ?? null,
      complemento: empresa.complemento ?? null,
      bairro: empresa.bairro ?? null,
      cidade: empresa.cidade,
      estado: empresa.estado,
      cep: empresa.cep,
      instagram: empresa.instagram ?? null,
      facebook: empresa.facebook ?? null,
      linkedin: empresa.linkedin ?? null,
      youtube: empresa.youtube ?? null,
      horarioAtendimento: empresa.horarioAtendimento ?? null,
      googleMapsUrl: empresa.googleMapsUrl ?? null,
      latitude: empresa.latitude ?? null,
      longitude: empresa.longitude ?? null,
      siteTitulo: empresa.siteTitulo ?? null,
      siteDescricao: empresa.siteDescricao ?? null,
      seoKeywords: empresa.seoKeywords ?? null,
      siteAtivo: empresa.siteAtivo !== false,
      siteExibirCorretores: empresa.siteExibirCorretores !== false,
      siteExibirBlog: empresa.siteExibirBlog !== false,
      plano: empresa.plano,
      ativo: empresa.ativo,
      updatedAt: empresa.updatedAt,
    };
  }

  async getCurrent(empresaId: number) {
    const empresa = await this.prisma.empresa.findFirst({
      where: { id: empresaId },
    });
    if (!empresa) {
      throw new NotFoundException('Empresa não encontrada');
    }
    return this.sanitize(empresa);
  }

  async update(user: AuthUser, dto: UpdateEmpresaDto) {
    if (user.perfil !== UserProfile.ADMIN) {
      throw new ForbiddenException(
        'Apenas administradores podem alterar a empresa',
      );
    }

    const emptyToNull = (value?: string | null) => {
      if (value === undefined) return undefined;
      if (value == null) return null;
      const trimmed = String(value).trim();
      return trimmed === '' ? null : trimmed;
    };

    const data = {
      ...(dto.nome !== undefined && { nome: dto.nome.trim() }),
      ...(dto.nomeFantasia !== undefined && {
        nomeFantasia: emptyToNull(dto.nomeFantasia),
      }),
      ...(dto.razaoSocial !== undefined && {
        razaoSocial: emptyToNull(dto.razaoSocial),
      }),
      ...(dto.cnpj !== undefined &&
        dto.cnpj != null && {
          cnpj: String(dto.cnpj).replace(/\D/g, ''),
        }),
      ...(dto.creci !== undefined && { creci: emptyToNull(dto.creci) }),
      ...(dto.slogan !== undefined && { slogan: emptyToNull(dto.slogan) }),
      ...(dto.email !== undefined && {
        email: dto.email ? dto.email.trim().toLowerCase() : null,
      }),
      ...(dto.telefone !== undefined && {
        telefone: emptyToNull(dto.telefone),
      }),
      ...(dto.whatsapp !== undefined && {
        whatsapp: dto.whatsapp
          ? String(dto.whatsapp).replace(/\D/g, '') || null
          : null,
      }),
      ...(dto.siteUrl !== undefined && { siteUrl: emptyToNull(dto.siteUrl) }),
      ...(dto.corPrimaria !== undefined && {
        corPrimaria: emptyToNull(dto.corPrimaria),
      }),
      ...(dto.corSecundaria !== undefined && {
        corSecundaria: emptyToNull(dto.corSecundaria),
      }),
      ...(dto.endereco !== undefined && {
        endereco: emptyToNull(dto.endereco),
      }),
      ...(dto.numero !== undefined && { numero: emptyToNull(dto.numero) }),
      ...(dto.complemento !== undefined && {
        complemento: emptyToNull(dto.complemento),
      }),
      ...(dto.bairro !== undefined && { bairro: emptyToNull(dto.bairro) }),
      ...(dto.cidade !== undefined && { cidade: emptyToNull(dto.cidade) }),
      ...(dto.estado !== undefined && {
        estado: dto.estado
          ? String(dto.estado).toUpperCase().slice(0, 2)
          : null,
      }),
      ...(dto.cep !== undefined && { cep: emptyToNull(dto.cep) }),
      ...(dto.instagram !== undefined && {
        instagram: emptyToNull(dto.instagram),
      }),
      ...(dto.facebook !== undefined && {
        facebook: emptyToNull(dto.facebook),
      }),
      ...(dto.linkedin !== undefined && {
        linkedin: emptyToNull(dto.linkedin),
      }),
      ...(dto.youtube !== undefined && { youtube: emptyToNull(dto.youtube) }),
      ...(dto.horarioAtendimento !== undefined && {
        horarioAtendimento: emptyToNull(dto.horarioAtendimento),
      }),
      ...(dto.googleMapsUrl !== undefined && {
        googleMapsUrl: emptyToNull(dto.googleMapsUrl),
      }),
      ...(dto.latitude !== undefined && { latitude: dto.latitude }),
      ...(dto.longitude !== undefined && { longitude: dto.longitude }),
      ...(dto.siteTitulo !== undefined && {
        siteTitulo: emptyToNull(dto.siteTitulo),
      }),
      ...(dto.siteDescricao !== undefined && {
        siteDescricao: emptyToNull(dto.siteDescricao),
      }),
      ...(dto.seoKeywords !== undefined && {
        seoKeywords: emptyToNull(dto.seoKeywords),
      }),
      ...(dto.siteAtivo !== undefined && { siteAtivo: dto.siteAtivo }),
      ...(dto.siteExibirCorretores !== undefined && {
        siteExibirCorretores: dto.siteExibirCorretores,
      }),
      ...(dto.siteExibirBlog !== undefined && {
        siteExibirBlog: dto.siteExibirBlog,
      }),
    } as Prisma.EmpresaUpdateInput;

    await this.prisma.empresa.update({
      where: { id: user.empresaId },
      data,
    });

    await this.auditService.logAudit(user, 'UPDATE', 'Empresa', user.empresaId);

    return this.getCurrent(user.empresaId);
  }

  async uploadAsset(user: AuthUser, kind: string, file?: Express.Multer.File) {
    if (user.perfil !== UserProfile.ADMIN) {
      throw new ForbiddenException(
        'Apenas administradores podem alterar a empresa',
      );
    }
    if (!file) {
      throw new NotFoundException('Arquivo não enviado');
    }

    const field =
      kind === 'favicon' || kind === 'faviconUrl' ? 'faviconUrl' : 'logoUrl';
    const url = `/uploads/empresa/${user.empresaId}/${file.filename}`;

    await this.prisma.empresa.update({
      where: { id: user.empresaId },
      data: { [field]: url },
    });

    await this.auditService.logAudit(
      user,
      'UPLOAD',
      'Empresa',
      user.empresaId,
      {
        kind: field,
      },
    );

    return this.getCurrent(user.empresaId);
  }
}
