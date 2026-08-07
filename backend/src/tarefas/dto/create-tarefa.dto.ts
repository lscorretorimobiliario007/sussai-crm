import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { PrioridadeTarefa, StatusTarefa } from '@prisma/client';

export class CreateTarefaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(240)
  titulo!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  descricao?: string | null;

  @IsOptional()
  @IsEnum(StatusTarefa)
  status?: StatusTarefa;

  @IsOptional()
  @IsEnum(PrioridadeTarefa)
  prioridade?: PrioridadeTarefa;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @IsDateString()
  vencimento?: string | null;

  /** Alias do frontend legado. */
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @IsDateString()
  dataLimite?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  responsavelId?: number | null;

  /** Alias do frontend legado. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  usuarioId?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  leadId?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  clienteId?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  propertyId?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  imovelId?: number | null;
}
