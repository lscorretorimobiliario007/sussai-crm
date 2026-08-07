import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common';
import { SiteService } from './site.service';
import { SitePropertiesQueryDto } from './dto/site-properties-query.dto';
import { CreatePublicLeadDto } from './dto/create-public-lead.dto';
import { RateLimit, RateLimitGuard } from '../common/middleware/rate-limit';

@Controller()
export class SiteController {
  constructor(private readonly siteService: SiteService) {}

  // ─── Público (sem JWT) — integração site Top Conceição ───────────────────

  @Post('public/leads')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RateLimitGuard)
  @RateLimit({
    windowMs: 60 * 60 * 1000,
    max: 20,
    keyPrefix: 'public-leads',
  })
  createLead(@Body() dto: CreatePublicLeadDto) {
    return this.siteService.createPublicLead(dto);
  }

  @Get('public/empresa')
  getEmpresa() {
    return this.siteService.getPublicEmpresa();
  }

  @Get('public/corretores')
  listCorretores() {
    return this.siteService.listPublicCorretores();
  }

  @Get('public/imoveis')
  listPublic(@Query() query: SitePropertiesQueryDto) {
    return this.siteService.listProperties(query);
  }

  @Get('public/imoveis/:codigo')
  detailPublic(@Param('codigo') codigo: string) {
    return this.siteService.getPropertyByCodigo(codigo);
  }

  // ─── Rotas atuais (compat) ───────────────────────────────────────────────

  @Get('site/home')
  home() {
    return this.siteService.getHome();
  }

  @Get('site/properties')
  list(@Query() query: SitePropertiesQueryDto) {
    return this.siteService.listProperties(query);
  }

  @Get('site/properties/:codigo')
  detail(@Param('codigo') codigo: string) {
    return this.siteService.getPropertyByCodigo(codigo);
  }
}
