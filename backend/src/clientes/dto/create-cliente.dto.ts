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
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import {
  InteresseCliente,
  StatusCliente,
  TipoCliente,
  TipoPessoa,
} from '@prisma/client';

export class CreateClienteDto {
  @IsOptional()
  @IsEnum(TipoCliente)
  tipo?: TipoCliente;

  @IsOptional()
  @IsEnum(TipoPessoa)
  tipoPessoa?: TipoPessoa;

  @IsOptional()
  @IsEnum(StatusCliente)
  status?: StatusCliente;

  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  nome!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  razaoSocial?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  nomeFantasia?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  cpfCnpj?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @IsEmail({}, { message: 'Informe um e-mail válido' })
  @MaxLength(160)
  email?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  telefone?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  whatsapp?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  endereco?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  cidade?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2)
  estado?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notas?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  origem?: string | null;

  @IsOptional()
  @IsArray()
  @IsEnum(InteresseCliente, { each: true })
  interesses?: InteresseCliente[];

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  faixaPrecoMin?: number | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  faixaPrecoMax?: number | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  cidadesInteresse?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @Type(() => Number)
  @IsInt()
  @Min(1)
  corretorId?: number | null;
}
