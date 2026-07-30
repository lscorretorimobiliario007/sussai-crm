import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { FinalidadeImovel, TipoImovel } from '@prisma/client';

function toOptionalBoolean({ value }: { value: unknown }) {
  if (value === undefined || value === null || value === '') return undefined;
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return value;
}

export class QueryPropertyDto {
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
  limit?: number = 20;

  @IsOptional()
  @IsString()
  cidade?: string;

  @IsOptional()
  @IsString()
  bairro?: string;

  @IsOptional()
  @IsEnum(TipoImovel)
  tipo?: TipoImovel;

  @IsOptional()
  @IsEnum(FinalidadeImovel)
  finalidade?: FinalidadeImovel;

  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  publicado?: boolean;
}
