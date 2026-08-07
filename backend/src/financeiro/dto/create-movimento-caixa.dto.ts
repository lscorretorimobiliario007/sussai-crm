import { Type } from 'class-transformer';
import {
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
import { FormaPagamentoFinanceiro, TipoMovimentoCaixa } from '@prisma/client';

export class CreateMovimentoCaixaDto {
  @IsEnum(TipoMovimentoCaixa)
  tipo!: TipoMovimentoCaixa;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  descricao!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  valor!: number;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== '')
  @IsEnum(FormaPagamentoFinanceiro)
  formaPagamento?: FormaPagamentoFinanceiro | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== '')
  @Type(() => Number)
  @IsInt()
  @Min(1)
  lancamentoId?: number | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== '')
  @Type(() => Number)
  @IsInt()
  @Min(1)
  comissaoId?: number | null;
}
