import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { StatusContrato, TipoContrato } from '@prisma/client';

export class CreateContratoDto {
  @IsEnum(TipoContrato)
  tipo!: TipoContrato;

  @IsOptional()
  @IsEnum(StatusContrato)
  status?: StatusContrato;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  valor!: number;

  @IsDateString()
  dataInicio!: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @IsDateString()
  dataFim?: string | null;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  clienteId!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  propertyId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  imovelId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  corretorId?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  observacoes?: string | null;

  /** Aceitos do frontend legado; não persistem no schema atual. */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  comissao?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(31)
  diaVencimento?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  proprietarioId?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  numero?: string | null;
}
