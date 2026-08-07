import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import {
  StatusLancamentoFinanceiro,
  TipoLancamentoFinanceiro,
} from '@prisma/client';

export class QueryLancamentoDto {
  @IsOptional()
  @IsEnum(TipoLancamentoFinanceiro)
  tipo?: TipoLancamentoFinanceiro;

  @IsOptional()
  @IsEnum(StatusLancamentoFinanceiro)
  status?: StatusLancamentoFinanceiro;

  @IsOptional()
  @IsString()
  busca?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoriaId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  centroCustoId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
