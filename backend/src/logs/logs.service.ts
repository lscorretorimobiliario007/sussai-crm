import { Injectable } from '@nestjs/common';
import { Prisma, SystemLogLevel } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LogsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    opts: {
      page?: number;
      limit?: number;
      level?: SystemLogLevel;
    } = {},
  ) {
    const page = opts.page ?? 1;
    const limit = Math.min(opts.limit ?? 50, 100);
    const where: Prisma.SystemLogWhereInput = {
      ...(opts.level ? { level: opts.level } : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.systemLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.systemLog.count({ where }),
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
}
