import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { UserProfile } from '@prisma/client';

export class CreateAuthUserDto {
  @IsNotEmpty()
  @IsString()
  nome!: string;

  @IsEmail()
  email!: string;

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
  telefone?: string;
}
