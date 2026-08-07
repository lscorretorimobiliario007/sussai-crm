import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Res,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthUser } from '../auth/types/auth-user.type';
import { ClientesService } from './clientes.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { QueryClienteDto } from './dto/query-cliente.dto';
import { ContatosClienteDto } from './dto/contatos-cliente.dto';
import { AnotacaoClienteDto } from './dto/anotacao-cliente.dto';
import { InteracaoClienteDto } from './dto/interacao-cliente.dto';
import { FavoritoClienteDto } from './dto/favorito-cliente.dto';
import { VisitaClienteDto } from './dto/visita-cliente.dto';
import { PropostaClienteDto } from './dto/proposta-cliente.dto';

@Controller('clientes')
@UseGuards(JwtAuthGuard)
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Get('opcoes')
  options(@CurrentUser() user: AuthUser) {
    return this.clientesService.options(user);
  }

  @Get('export/excel')
  async exportExcel(
    @CurrentUser() user: AuthUser,
    @Query('ativo') ativo: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const buffer = await this.clientesService.exportExcel(
      user,
      ativo !== 'false',
    );
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="clientes.csv"',
    });
    return buffer;
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query() query: QueryClienteDto) {
    return this.clientesService.findAll(user, query);
  }

  @Get(':id/export/pdf')
  async exportPdf(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Res({ passthrough: true }) res: Response,
  ) {
    const buffer = await this.clientesService.exportPdf(user, id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="cliente-${id}.pdf"`,
    });
    return buffer;
  }

  @Get(':id/historico')
  historico(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.clientesService.historico(
      user,
      id,
      page ? Number(page) : 1,
      limit ? Number(limit) : 10,
    );
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.clientesService.findOne(user, id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateClienteDto) {
    return this.clientesService.create(user, dto);
  }

  @Put(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateClienteDto,
  ) {
    return this.clientesService.update(user, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.clientesService.remove(user, id);
  }

  @Post(':id/reativar')
  reactivate(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.clientesService.reactivate(user, id);
  }

  @Put(':id/contatos')
  updateContatos(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ContatosClienteDto,
  ) {
    return this.clientesService.updateContatos(user, id, dto);
  }

  @Post(':id/anotacoes')
  addAnotacao(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AnotacaoClienteDto,
  ) {
    return this.clientesService.addAnotacao(user, id, dto);
  }

  @Post(':id/interacoes')
  addInteracao(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: InteracaoClienteDto,
  ) {
    return this.clientesService.addInteracao(user, id, dto);
  }

  @Post(':id/favoritos')
  addFavorito(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: FavoritoClienteDto,
  ) {
    return this.clientesService.addFavorito(user, id, dto);
  }

  @Delete(':id/favoritos/:imovelId')
  removeFavorito(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Param('imovelId', ParseIntPipe) imovelId: number,
  ) {
    return this.clientesService.removeFavorito(user, id, imovelId);
  }

  @Post(':id/visitas')
  addVisita(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: VisitaClienteDto,
  ) {
    return this.clientesService.addVisita(user, id, dto);
  }

  @Post(':id/propostas')
  addProposta(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PropostaClienteDto,
  ) {
    return this.clientesService.addProposta(user, id, dto);
  }

  @Post(':id/avatar')
  @UseInterceptors(FileInterceptor('avatar', { storage: memoryStorage() }))
  uploadAvatar(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    void file;
    return this.clientesService.uploadAvatar(user, id);
  }

  @Post(':id/documentos')
  @UseInterceptors(
    FilesInterceptor('documentos', 10, { storage: memoryStorage() }),
  )
  uploadDocumentos(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() files: Express.Multer.File[],
    @Body('tipo') tipo?: string,
    @Body('nome') nome?: string,
  ) {
    return this.clientesService.uploadDocumentos(user, id, files, tipo, nome);
  }

  @Delete(':id/documentos/:docId')
  removeDocumento(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Param('docId', ParseIntPipe) docId: number,
  ) {
    return this.clientesService.removeDocumento(user, id, docId);
  }

  @Post(':id/compartilhar')
  share(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.clientesService.share(user, id);
  }
}
