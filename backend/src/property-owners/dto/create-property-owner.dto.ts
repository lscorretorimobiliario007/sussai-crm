import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

export class CreatePropertyOwnerDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  nome!: string;

  @IsOptional()
  @IsString()
  @Length(11, 11)
  cpf?: string | null;

  @IsOptional()
  @IsString()
  @Length(14, 14)
  cnpj?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  rg?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefone?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  celular?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  whatsapp?: string | null;

  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  email?: string | null;

  @IsOptional()
  @IsString()
  @Length(8, 8)
  cep?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  rua?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  numero?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  complemento?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  bairro?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  cidade?: string | null;

  @IsOptional()
  @IsString()
  @Length(2, 2)
  estado?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  observacoes?: string | null;
}
