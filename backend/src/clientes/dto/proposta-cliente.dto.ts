import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { StatusPropostaCliente } from '@prisma/client';

export class PropostaClienteDto {
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @Type(() => Number)
  @IsInt()
  @Min(1)
  imovelId?: number;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @Type(() => Number)
  @IsInt()
  @Min(1)
  propertyId?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  valor!: number;

  @IsOptional()
  @IsEnum(StatusPropostaCliente)
  status?: StatusPropostaCliente;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  observacoes?: string | null;
}
