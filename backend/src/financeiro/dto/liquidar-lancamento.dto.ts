import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  Min,
  ValidateIf,
} from 'class-validator';
import { FormaPagamentoFinanceiro } from '@prisma/client';

export class LiquidarLancamentoDto {
  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== '')
  @IsEnum(FormaPagamentoFinanceiro)
  formaPagamento?: FormaPagamentoFinanceiro | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  valorPago?: number;

  @IsOptional()
  @IsDateString()
  dataPagamento?: string;

  @IsOptional()
  registrarNoCaixa?: boolean;
}
