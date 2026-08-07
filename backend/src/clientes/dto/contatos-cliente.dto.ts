import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

class TelefoneContatoDto {
  @IsOptional()
  @IsString()
  @MaxLength(40)
  numero?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  tipo?: string;

  @IsOptional()
  @IsBoolean()
  principal?: boolean;
}

class EmailContatoDto {
  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  tipo?: string;

  @IsOptional()
  @IsBoolean()
  principal?: boolean;
}

class EnderecoContatoDto {
  @IsOptional()
  @IsString()
  @MaxLength(40)
  tipo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  logradouro?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  numero?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  complemento?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  bairro?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  cidade?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2)
  estado?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  cep?: string;

  @IsOptional()
  @IsBoolean()
  principal?: boolean;
}

export class ContatosClienteDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TelefoneContatoDto)
  telefones?: TelefoneContatoDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmailContatoDto)
  emails?: EmailContatoDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EnderecoContatoDto)
  enderecos?: EnderecoContatoDto[];
}
