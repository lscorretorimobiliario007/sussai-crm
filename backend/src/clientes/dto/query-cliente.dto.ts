import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import {
  InteresseCliente,
  StatusCliente,
  TipoCliente,
  TipoPessoa,
} from '@prisma/client';

function toOptionalBoolean({ value }: { value: unknown }) {
  if (value === undefined || value === null || value === '') return undefined;
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return value;
}

export class QueryClienteDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 12;

  @IsOptional()
  @IsString()
  busca?: string;

  @IsOptional()
  @IsEnum(TipoCliente)
  tipo?: TipoCliente;

  @IsOptional()
  @IsEnum(TipoPessoa)
  tipoPessoa?: TipoPessoa;

  @IsOptional()
  @IsEnum(StatusCliente)
  status?: StatusCliente;

  @IsOptional()
  @IsString()
  cidade?: string;

  @IsOptional()
  @IsString()
  origem?: string;

  @IsOptional()
  @IsString()
  tag?: string;

  @IsOptional()
  @IsEnum(InteresseCliente)
  interesse?: InteresseCliente;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  corretorId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  faixaPrecoMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  faixaPrecoMax?: number;

  @IsOptional()
  @IsString()
  ordenacao?: string = 'nome';

  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  ativo?: boolean = true;
}
