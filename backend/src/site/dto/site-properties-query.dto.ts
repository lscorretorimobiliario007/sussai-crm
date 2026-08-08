import { Type } from 'class-transformer';
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
import { FinalidadeImovel } from '@prisma/client';

export class SitePropertiesQueryDto {
  @IsOptional()
  @IsString()
  cidade?: string;

  @IsOptional()
  @IsString()
  bairro?: string;

  @IsOptional()
  @IsString()
  tipo?: string;

  @IsOptional()
  @IsEnum(FinalidadeImovel)
  finalidade?: FinalidadeImovel;

  @IsOptional()
  @IsString()
  busca?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minValor?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxValor?: number;

  /** Alias site: valorMin */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  valorMin?: number;

  /** Alias site: valorMax */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  valorMax?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  quartos?: number;

  /** Alias site: quartosMin */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  quartosMin?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  destaque?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  destaqueSite?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  lancamento?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  altoPadrao?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  comercial?: boolean;

  @IsOptional()
  @IsString()
  ordenacao?: string;

  @IsOptional()
  @IsString()
  secao?: string;

  @IsOptional()
  @IsString()
  caracteristicas?: string;

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
}
