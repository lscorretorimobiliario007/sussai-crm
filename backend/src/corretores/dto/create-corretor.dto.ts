import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { StatusCorretor, UserProfile } from '@prisma/client';

export class CreateCorretorDto {
  @IsNotEmpty()
  @IsString()
  nome!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  telefone?: string;

  @MinLength(8)
  senha!: string;

  @IsOptional()
  @IsEnum(UserProfile)
  tipo?: UserProfile;

  @IsOptional()
  @IsEnum(UserProfile)
  perfil?: UserProfile;

  @IsOptional()
  @IsString()
  creci?: string;

  @IsOptional()
  @IsString()
  crea?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  comissaoPadrao?: number;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  metaMensal?: number | null;

  @IsOptional()
  @IsEnum(StatusCorretor)
  statusCorretor?: StatusCorretor;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  equipeId?: number | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissoes?: string[];
}
