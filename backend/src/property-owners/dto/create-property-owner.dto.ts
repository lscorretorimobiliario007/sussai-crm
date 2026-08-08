import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  ValidateIf,
} from 'class-validator';

/** Empty strings from forms become null so @IsOptional validators skip them. */
function EmptyToNull() {
  return Transform(({ value }: { value: unknown }) => {
    if (value === undefined || value === null) return null;
    if (typeof value === 'string' && value.trim() === '') return null;
    return typeof value === 'string' ? value.trim() : value;
  });
}

export class CreatePropertyOwnerDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  nome!: string;

  @IsOptional()
  @EmptyToNull()
  @ValidateIf((_, v) => v != null)
  @IsString()
  @Length(11, 11)
  cpf?: string | null;

  @IsOptional()
  @EmptyToNull()
  @ValidateIf((_, v) => v != null)
  @IsString()
  @Length(14, 14)
  cnpj?: string | null;

  @IsOptional()
  @EmptyToNull()
  @ValidateIf((_, v) => v != null)
  @IsString()
  @MaxLength(30)
  rg?: string | null;

  @IsOptional()
  @EmptyToNull()
  @ValidateIf((_, v) => v != null)
  @IsString()
  @MaxLength(30)
  telefone?: string | null;

  @IsOptional()
  @EmptyToNull()
  @ValidateIf((_, v) => v != null)
  @IsString()
  @MaxLength(30)
  celular?: string | null;

  @IsOptional()
  @EmptyToNull()
  @ValidateIf((_, v) => v != null)
  @IsString()
  @MaxLength(30)
  whatsapp?: string | null;

  @IsOptional()
  @EmptyToNull()
  @ValidateIf((_, v) => v != null)
  @IsEmail()
  @MaxLength(160)
  email?: string | null;

  @IsOptional()
  @EmptyToNull()
  @ValidateIf((_, v) => v != null)
  @IsString()
  @Length(8, 8)
  cep?: string | null;

  @IsOptional()
  @EmptyToNull()
  @ValidateIf((_, v) => v != null)
  @IsString()
  @MaxLength(200)
  rua?: string | null;

  @IsOptional()
  @EmptyToNull()
  @ValidateIf((_, v) => v != null)
  @IsString()
  @MaxLength(30)
  numero?: string | null;

  @IsOptional()
  @EmptyToNull()
  @ValidateIf((_, v) => v != null)
  @IsString()
  @MaxLength(120)
  complemento?: string | null;

  @IsOptional()
  @EmptyToNull()
  @ValidateIf((_, v) => v != null)
  @IsString()
  @MaxLength(120)
  bairro?: string | null;

  @IsOptional()
  @EmptyToNull()
  @ValidateIf((_, v) => v != null)
  @IsString()
  @MaxLength(120)
  cidade?: string | null;

  @IsOptional()
  @EmptyToNull()
  @ValidateIf((_, v) => v != null)
  @IsString()
  @Length(2, 2)
  estado?: string | null;

  @IsOptional()
  @EmptyToNull()
  @ValidateIf((_, v) => v != null)
  @IsString()
  @MaxLength(5000)
  observacoes?: string | null;
}
