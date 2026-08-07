import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { StatusCobranca, StatusComissao, UserProfile } from '@prisma/client';
import { FinanceiroService } from './financeiro.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';
import { CreateLancamentoDto } from './dto/create-lancamento.dto';
import { LiquidarLancamentoDto } from './dto/liquidar-lancamento.dto';
import { QueryLancamentoDto } from './dto/query-lancamento.dto';
import { CreateCobrancaDto } from './dto/create-cobranca.dto';
import { PagarCobrancaDto } from './dto/pagar-cobranca.dto';
import { CreateComissaoDto } from './dto/create-comissao.dto';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { CreateCentroCustoDto } from './dto/create-centro-custo.dto';
import { CreateCaixaDto } from './dto/create-caixa.dto';
import { CreateMovimentoCaixaDto } from './dto/create-movimento-caixa.dto';
import { CreateConciliacaoDto } from './dto/create-conciliacao.dto';

@Controller('financeiro')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserProfile.ADMIN, UserProfile.GERENTE)
export class FinanceiroController {
  constructor(private readonly financeiroService: FinanceiroService) {}

  @Get('opcoes')
  opcoes(@CurrentUser() user: AuthUser) {
    return this.financeiroService.opcoes(user.empresaId);
  }

  @Get('dashboard')
  dashboard(@CurrentUser() user: AuthUser) {
    return this.financeiroService.dashboard(user.empresaId);
  }

  @Get('lancamentos')
  listarLancamentos(
    @CurrentUser() user: AuthUser,
    @Query() query: QueryLancamentoDto,
  ) {
    return this.financeiroService.listarLancamentos(user.empresaId, query);
  }

  @Post('lancamentos')
  criarLancamento(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateLancamentoDto,
  ) {
    return this.financeiroService.criarLancamento(user.empresaId, dto);
  }

  @Post('lancamentos/:id/liquidar')
  liquidarLancamento(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: LiquidarLancamentoDto,
  ) {
    return this.financeiroService.liquidarLancamento(user.empresaId, id, dto);
  }

  @Get('cobrancas')
  listarCobrancas(
    @CurrentUser() user: AuthUser,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: StatusCobranca,
    @Query('busca') busca?: string,
  ) {
    return this.financeiroService.listarCobrancas(user.empresaId, {
      page,
      limit,
      status,
      busca,
    });
  }

  @Post('cobrancas')
  criarCobranca(@CurrentUser() user: AuthUser, @Body() dto: CreateCobrancaDto) {
    return this.financeiroService.criarCobranca(user.empresaId, dto);
  }

  @Patch('cobrancas/:id/pagar')
  pagarCobranca(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PagarCobrancaDto,
  ) {
    return this.financeiroService.pagarCobranca(user.empresaId, id, dto);
  }

  @Post('cobrancas/gerar-mensais')
  gerarCobrancasMensais(@CurrentUser() user: AuthUser) {
    return this.financeiroService.gerarCobrancasMensais(user.empresaId);
  }

  @Get('comissoes')
  listarComissoes(
    @CurrentUser() user: AuthUser,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: StatusComissao,
  ) {
    return this.financeiroService.listarComissoes(user.empresaId, {
      page,
      limit,
      status,
    });
  }

  @Post('comissoes')
  criarComissao(@CurrentUser() user: AuthUser, @Body() dto: CreateComissaoDto) {
    return this.financeiroService.criarComissao(user.empresaId, dto);
  }

  @Post('comissoes/:id/aprovar')
  aprovarComissao(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.financeiroService.aprovarComissao(user.empresaId, id);
  }

  @Post('comissoes/:id/pagar')
  pagarComissao(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.financeiroService.pagarComissao(user.empresaId, id);
  }

  @Post('comissoes/gerar-de-contrato/:contratoId')
  gerarComissaoDeContrato(
    @CurrentUser() user: AuthUser,
    @Param('contratoId', ParseIntPipe) contratoId: number,
  ) {
    return this.financeiroService.gerarComissaoDeContrato(
      user.empresaId,
      contratoId,
    );
  }

  @Get('fluxo-caixa')
  fluxoCaixa(
    @CurrentUser() user: AuthUser,
    @Query('inicio') inicio?: string,
    @Query('fim') fim?: string,
  ) {
    return this.financeiroService.fluxoCaixa(user.empresaId, inicio, fim);
  }

  @Get('dre')
  dre(
    @CurrentUser() user: AuthUser,
    @Query('ano') ano?: number,
    @Query('mes') mes?: number,
  ) {
    return this.financeiroService.dre(user.empresaId, ano, mes);
  }

  @Get('caixa')
  listarCaixas(
    @CurrentUser() user: AuthUser,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.financeiroService.listarCaixas(user.empresaId, page, limit);
  }

  @Post('caixa')
  abrirCaixa(@CurrentUser() user: AuthUser, @Body() dto: CreateCaixaDto) {
    return this.financeiroService.abrirCaixa(user.empresaId, dto);
  }

  @Get('caixa/:id')
  buscarCaixa(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.financeiroService.buscarCaixa(user.empresaId, id);
  }

  @Post('caixa/:id/movimentos')
  adicionarMovimento(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateMovimentoCaixaDto,
  ) {
    return this.financeiroService.adicionarMovimento(user.empresaId, id, dto);
  }

  @Post('caixa/:id/fechar')
  fecharCaixa(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() body?: { observacoes?: string },
  ) {
    return this.financeiroService.fecharCaixa(user, id, body?.observacoes);
  }

  @Get('conciliacoes')
  listarConciliacoes(
    @CurrentUser() user: AuthUser,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.financeiroService.listarConciliacoes(
      user.empresaId,
      page,
      limit,
    );
  }

  @Post('conciliacoes')
  criarConciliacao(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateConciliacaoDto,
  ) {
    return this.financeiroService.criarConciliacao(user, dto);
  }

  @Post('conciliacoes/:id/finalizar')
  finalizarConciliacao(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() body?: { saldoExtrato?: number; observacoes?: string },
  ) {
    return this.financeiroService.finalizarConciliacao(
      user.empresaId,
      id,
      body,
    );
  }

  @Get('categorias')
  listarCategorias(@CurrentUser() user: AuthUser) {
    return this.financeiroService.listarCategorias(user.empresaId);
  }

  @Post('categorias')
  criarCategoria(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateCategoriaDto,
  ) {
    return this.financeiroService.criarCategoria(user.empresaId, dto);
  }

  @Get('centros-custo')
  listarCentrosCusto(@CurrentUser() user: AuthUser) {
    return this.financeiroService.listarCentrosCusto(user.empresaId);
  }

  @Post('centros-custo')
  criarCentroCusto(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateCentroCustoDto,
  ) {
    return this.financeiroService.criarCentroCusto(user.empresaId, dto);
  }

  @Get('export/:type')
  async exportar(
    @CurrentUser() user: AuthUser,
    @Param('type') type: string,
    @Query() query: QueryLancamentoDto,
    @Res() res: Response,
  ) {
    const file = await this.financeiroService.exportar(
      user.empresaId,
      type,
      query,
    );
    res.setHeader('Content-Type', file.contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.filename}"`,
    );
    res.send(file.buffer);
  }
}
