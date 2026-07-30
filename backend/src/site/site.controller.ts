import { Controller, Get, Param, Query } from '@nestjs/common';
import { SiteService } from './site.service';
import { SitePropertiesQueryDto } from './dto/site-properties-query.dto';

@Controller()
export class SiteController {
  constructor(private readonly siteService: SiteService) {}

  // Compatibilidade com o site
  @Get('public/imoveis')
  listPublic(@Query() query: SitePropertiesQueryDto) {
    return this.siteService.listProperties(query);
  }

  @Get('public/imoveis/:codigo')
  detailPublic(@Param('codigo') codigo: string) {
    return this.siteService.getPropertyByCodigo(codigo);
  }

  // Rotas atuais
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