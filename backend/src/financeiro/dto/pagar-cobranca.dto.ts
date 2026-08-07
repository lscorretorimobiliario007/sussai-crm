import { IsEnum, IsOptional, ValidateIf } from 'class-validator';
import { FormaPagamentoFinanceiro } from '@prisma/client';

export class PagarCobrancaDto {
  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== '')
  @IsEnum(FormaPagamentoFinanceiro)
  formaPagamento?: FormaPagamentoFinanceiro | null;
}
