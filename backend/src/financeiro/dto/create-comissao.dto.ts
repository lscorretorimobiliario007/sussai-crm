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
import { StatusComissao } from '@prisma/client';

export class CreateComissaoDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  corretorId!: number;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== '')
  @Type(() => Number)
  @IsInt()
  @Min(1)
  contratoId?: number | null;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  descricao!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  valorBase!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  percentual!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  valor!: number;

  @IsDateString()
  competencia!: string;

  @IsOptional()
  @IsEnum(StatusComissao)
  status?: StatusComissao;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== '')
  @Type(() => Number)
  @IsInt()
  @Min(1)
  centroCustoId?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  observacoes?: string | null;
}
