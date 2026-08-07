import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

const HEX_COLOR = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

export class UpdateEmpresaDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  nome?: string;

  @IsOptional()
  @IsString()
  nomeFantasia?: string | null;

  @IsOptional()
  @IsString()
  razaoSocial?: string | null;

  @IsOptional()
  @IsString()
  cnpj?: string | null;

  @IsOptional()
  @IsString()
  creci?: string | null;

  @IsOptional()
  @IsString()
  slogan?: string | null;

  @IsOptional()
  @IsEmail()
  email?: string | null;

  @IsOptional()
  @IsString()
  telefone?: string | null;

  @IsOptional()
  @IsString()
  whatsapp?: string | null;

  @IsOptional()
  @IsString()
  siteUrl?: string | null;

  @IsOptional()
  @IsString()
  @Matches(HEX_COLOR, {
    message: 'corPrimaria deve ser cor hexadecimal (#RRGGBB)',
  })
  corPrimaria?: string | null;

  @IsOptional()
  @IsString()
  @Matches(HEX_COLOR, {
    message: 'corSecundaria deve ser cor hexadecimal (#RRGGBB)',
  })
  corSecundaria?: string | null;

  @IsOptional()
  @IsString()
  endereco?: string | null;

  @IsOptional()
  @IsString()
  numero?: string | null;

  @IsOptional()
  @IsString()
  complemento?: string | null;

  @IsOptional()
  @IsString()
  bairro?: string | null;

  @IsOptional()
  @IsString()
  cidade?: string | null;

  @IsOptional()
  @IsString()
  estado?: string | null;

  @IsOptional()
  @IsString()
  cep?: string | null;

  @IsOptional()
  @IsString()
  instagram?: string | null;

  @IsOptional()
  @IsString()
  facebook?: string | null;

  @IsOptional()
  @IsString()
  linkedin?: string | null;

  @IsOptional()
  @IsString()
  youtube?: string | null;

  @IsOptional()
  @IsString()
  horarioAtendimento?: string | null;

  @IsOptional()
  @IsString()
  googleMapsUrl?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number | null;

  @IsOptional()
  @IsString()
  siteTitulo?: string | null;

  @IsOptional()
  @IsString()
  siteDescricao?: string | null;

  @IsOptional()
  @IsString()
  seoKeywords?: string | null;

  @IsOptional()
  @IsBoolean()
  siteAtivo?: boolean;

  @IsOptional()
  @IsBoolean()
  siteExibirCorretores?: boolean;

  @IsOptional()
  @IsBoolean()
  siteExibirBlog?: boolean;
}
