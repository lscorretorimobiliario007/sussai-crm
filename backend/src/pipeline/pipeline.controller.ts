import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PipelineService } from './pipeline.service';
import {
  CreatePipelineStageDto,
  UpdatePipelineStageDto,
} from './dto/pipeline-stage.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';

@Controller('pipeline/stages')
@UseGuards(JwtAuthGuard)
export class PipelineController {
  constructor(private readonly pipelineService: PipelineService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.pipelineService.listStages(user.empresaId);
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreatePipelineStageDto,
  ) {
    return this.pipelineService.createStage(user.empresaId, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePipelineStageDto,
  ) {
    return this.pipelineService.updateStage(user.empresaId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.pipelineService.removeStage(user.empresaId, id);
  }
}
