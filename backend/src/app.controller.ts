import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('teste')
  teste() {
    return {
      ok: true,
      mensagem: 'Backend funcionando',
    };
  }

  /** Healthcheck de produção — usado pelo pipeline de deploy. */
  @Get('health')
  async health() {
    await this.prisma.$queryRaw`SELECT 1`;
    return {
      ok: true,
      status: 'healthy',
      service: 'sussai-api',
      timestamp: new Date().toISOString(),
    };
  }
}
