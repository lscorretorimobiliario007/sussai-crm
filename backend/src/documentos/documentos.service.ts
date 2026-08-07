import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { AuthUser } from '../auth/types/auth-user.type';

@Injectable()
export class DocumentosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  findAll(empresaId: number) {
    return this.prisma.documento.findMany({
      where: { empresaId },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        uploadedBy: { select: { id: true, nome: true } },
      },
    });
  }

  async uploadStub(
    user: AuthUser,
    file?: Express.Multer.File,
    meta?: { nome?: string; entityType?: string; entityId?: string },
  ) {
    if (!file) {
      throw new BadRequestException('Arquivo não enviado');
    }

    const doc = await this.prisma.documento.create({
      data: {
        empresaId: user.empresaId,
        nome: meta?.nome?.trim() || file.originalname,
        filePath: `/uploads/documentos/${user.empresaId}/${file.filename}`,
        mimeType: file.mimetype,
        size: file.size,
        entityType: meta?.entityType || null,
        entityId: meta?.entityId || null,
        uploadedById: user.id,
      },
      include: {
        uploadedBy: { select: { id: true, nome: true } },
      },
    });

    await this.auditService.logAudit(user, 'UPLOAD', 'Documento', doc.id, {
      nome: doc.nome,
    });

    return doc;
  }
}
