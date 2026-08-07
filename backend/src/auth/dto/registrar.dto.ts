import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegistrarDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  empresaNome!: string;

  @IsOptional()
  @IsString()
  @MaxLength(18)
  empresaCnpj?: string;

  @IsEmail()
  empresaEmail!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  empresaTelefone?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nome!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8, { message: 'A senha deve ter pelo menos 8 caracteres' })
  senha!: string;
}
