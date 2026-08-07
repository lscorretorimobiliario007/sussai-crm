import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import {
  FormaPagamentoFinanceiro,
  StatusLancamentoFinanceiro,
  TipoLancamentoFinanceiro,
} from '@prisma/client';

export class CreateLancamentoDto {
  @IsEnum(TipoLancamentoFinanceiro)
  tipo!: TipoLancamentoFinanceiro;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  descricao!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  valor!: number;

  @IsDateString()
  vencimento!: string;

  @IsOptional()
  @IsEnum(StatusLancamentoFinanceiro)
  status?: StatusLancamentoFinanceiro;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== '')
  @IsEnum(FormaPagamentoFinanceiro)
  formaPagamento?: FormaPagamentoFinanceiro | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== '')
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoriaId?: number | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== '')
  @Type(() => Number)
  @IsInt()
  @Min(1)
  centroCustoId?: number | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== '')
  @Type(() => Number)
  @IsInt()
  @Min(1)
  clienteId?: number | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== '')
  @Type(() => Number)
  @IsInt()
  @Min(1)
  contratoId?: number | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== '')
  @Type(() => Number)
  @IsInt()
  @Min(1)
  corretorId?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  observacoes?: string | null;
}
