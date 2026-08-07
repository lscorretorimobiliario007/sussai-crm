import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PropertyImage } from '@prisma/client';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { PrismaService } from '../../prisma/prisma.service';
import {
  MAX_PROPERTY_IMAGES,
  PROPERTY_UPLOAD_ROOT,
} from './property-images.storage';

export type PropertyImageResponse = PropertyImage & {
  url: string;
};

@Injectable()
export class PropertyImagesService {
  constructor(private readonly prisma: PrismaService) {}

  async upload(
    empresaId: number,
    propertyId: number,
    files: Express.Multer.File[],
  ): Promise<PropertyImageResponse[]> {
    if (!files?.length) {
      throw new BadRequestException('Selecione ao menos uma imagem');
    }

    await this.ensurePropertyAccess(empresaId, propertyId);

    const existingCount = await this.prisma.propertyImage.count({
      where: { propertyId },
    });

    if (existingCount + files.length > MAX_PROPERTY_IMAGES) {
      this.cleanupUploadedFiles(files);
      throw new BadRequestException(
        `Limite de ${MAX_PROPERTY_IMAGES} imagens por imóvel excedido`,
      );
    }

    const hasCover = await this.prisma.propertyImage.findFirst({
      where: { propertyId, isCover: true },
      select: { id: true },
    });

    const created = await this.prisma.$transaction(async (tx) => {
      const images: PropertyImage[] = [];

      for (const [index, file] of files.entries()) {
        const relativePath = join(
          'properties',
          String(propertyId),
          file.filename,
        ).replace(/\\/g, '/');

        const image = await tx.propertyImage.create({
          data: {
            propertyId,
            fileName: file.filename,
            filePath: relativePath,
            mimeType: file.mimetype,
            size: file.size,
            order: existingCount + index,
            isCover: !hasCover && index === 0,
          },
        });

        images.push(image);
      }

      return images;
    });

    return created.map((image) => this.toResponse(image));
  }

  async list(
    empresaId: number,
    propertyId: number,
  ): Promise<PropertyImageResponse[]> {
    await this.ensurePropertyAccess(empresaId, propertyId);

    const images = await this.prisma.propertyImage.findMany({
      where: { propertyId },
      orderBy: [{ isCover: 'desc' }, { order: 'asc' }, { id: 'asc' }],
    });

    return images.map((image) => this.toResponse(image));
  }

  async remove(
    empresaId: number,
    propertyId: number,
    imageId: number,
  ): Promise<{ mensagem: string }> {
    await this.ensurePropertyAccess(empresaId, propertyId);

    const image = await this.prisma.propertyImage.findFirst({
      where: { id: imageId, propertyId },
    });

    if (!image) {
      throw new NotFoundException('Imagem não encontrada');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.propertyImage.delete({ where: { id: image.id } });

      if (image.isCover) {
        const nextCover = await tx.propertyImage.findFirst({
          where: { propertyId },
          orderBy: [{ order: 'asc' }, { id: 'asc' }],
        });

        if (nextCover) {
          await tx.propertyImage.update({
            where: { id: nextCover.id },
            data: { isCover: true },
          });
        }
      }

      const remaining = await tx.propertyImage.findMany({
        where: { propertyId },
        orderBy: [{ order: 'asc' }, { id: 'asc' }],
        select: { id: true },
      });

      await Promise.all(
        remaining.map((item, index) =>
          tx.propertyImage.update({
            where: { id: item.id },
            data: { order: index },
          }),
        ),
      );
    });

    this.deletePhysicalFile(image.filePath, image.fileName, propertyId);

    return { mensagem: 'Imagem removida com sucesso' };
  }

  async setCover(
    empresaId: number,
    propertyId: number,
    imageId: number,
  ): Promise<PropertyImageResponse> {
    await this.ensurePropertyAccess(empresaId, propertyId);

    const image = await this.prisma.propertyImage.findFirst({
      where: { id: imageId, propertyId },
    });

    if (!image) {
      throw new NotFoundException('Imagem não encontrada');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.propertyImage.updateMany({
        where: { propertyId, isCover: true },
        data: { isCover: false },
      });

      return tx.propertyImage.update({
        where: { id: image.id },
        data: { isCover: true },
      });
    });

    return this.toResponse(updated);
  }

  async reorder(
    empresaId: number,
    propertyId: number,
    imageIds: number[],
  ): Promise<PropertyImageResponse[]> {
    await this.ensurePropertyAccess(empresaId, propertyId);

    const existing = await this.prisma.propertyImage.findMany({
      where: { propertyId },
      select: { id: true },
    });

    if (existing.length === 0) {
      throw new BadRequestException(
        'Este imóvel não possui imagens para ordenar',
      );
    }

    const existingIds = existing.map((item) => item.id).sort((a, b) => a - b);
    const incomingIds = [...imageIds].sort((a, b) => a - b);

    if (
      existingIds.length !== incomingIds.length ||
      existingIds.some((id, index) => id !== incomingIds[index])
    ) {
      throw new BadRequestException(
        'Envie todos os IDs das imagens do imóvel, sem duplicar ou omitir',
      );
    }

    await this.prisma.$transaction(
      imageIds.map((id, index) =>
        this.prisma.propertyImage.update({
          where: { id },
          data: { order: index },
        }),
      ),
    );

    return this.list(empresaId, propertyId);
  }

  private async ensurePropertyAccess(empresaId: number, propertyId: number) {
    const property = await this.prisma.property.findFirst({
      where: {
        id: propertyId,
        empresaId,
        ativo: true,
      },
      select: { id: true },
    });

    if (!property) {
      throw new NotFoundException('Imóvel não encontrado');
    }

    return property;
  }

  private toResponse(image: PropertyImage): PropertyImageResponse {
    return {
      ...image,
      url: this.buildPublicUrl(image.filePath),
    };
  }

  private buildPublicUrl(filePath: string): string {
    let normalized = filePath.replace(/\\/g, '/').replace(/^\/+/, '');
    if (normalized.startsWith('uploads/')) {
      normalized = normalized.slice('uploads/'.length);
    }
    const relative = `/uploads/${normalized}`;
    const base = (process.env.PUBLIC_BASE_URL || '').replace(/\/+$/, '');
    return base ? `${base}${relative}` : relative;
  }

  private deletePhysicalFile(
    filePath: string,
    fileName: string,
    propertyId: number,
  ): void {
    const candidates = [
      join(process.cwd(), 'uploads', filePath),
      join(PROPERTY_UPLOAD_ROOT, String(propertyId), fileName),
    ];

    for (const candidate of candidates) {
      if (existsSync(candidate)) {
        try {
          unlinkSync(candidate);
        } catch {
          // Mantém a exclusão do banco mesmo se o arquivo já não existir.
        }
        return;
      }
    }
  }

  private cleanupUploadedFiles(files: Express.Multer.File[]): void {
    for (const file of files) {
      if (file.path && existsSync(file.path)) {
        try {
          unlinkSync(file.path);
        } catch {
          // noop
        }
      }
    }
  }
}
