import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { LeadOrigem } from '@prisma/client';

export enum TipoFormularioSite {
  CONTATO = 'CONTATO',
  INTERESSE = 'INTERESSE',
  AVALIACAO = 'AVALIACAO',
  VISITA = 'VISITA',
  ANUNCIO = 'ANUNCIO',
  CAPTACAO = 'CAPTACAO',
  NEWSLETTER = 'NEWSLETTER',
}

export class CreatePublicLeadDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  nome!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(40)
  telefone!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  whatsapp?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  mensagem?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  imovelId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  propertyId?: number;

  @IsOptional()
  @IsEnum(TipoFormularioSite)
  tipoFormulario?: TipoFormularioSite;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  agendarVisita?: boolean;

  @IsOptional()
  @IsISO8601()
  dataVisita?: string;

  @IsOptional()
  @IsEnum(LeadOrigem)
  origem?: LeadOrigem;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  paginaOrigem?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  utmSource?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  utmMedium?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  utmCampaign?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  utmTerm?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  utmContent?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  canal?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  lgpdAceite?: boolean;

  /** Alias enviado pelo site */
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  aceiteLgpd?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  tipoImovel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  finalidade?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  cidade?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  bairro?: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  endereco?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  dormitorios?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  suites?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  banheiros?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  vagas?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  area?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  valorDesejado?: number;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  descricaoImovel?: string;

  /** Alias do site */
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  descricao?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  fotosCount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  fotosNomes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  ip?: string;
}
