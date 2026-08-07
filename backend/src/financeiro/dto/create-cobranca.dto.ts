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
import { FormaPagamentoFinanceiro } from '@prisma/client';

export class CreateCobrancaDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  contratoId!: number;

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
  @IsEnum(FormaPagamentoFinanceiro)
  formaPagamento?: FormaPagamentoFinanceiro | null;
}
