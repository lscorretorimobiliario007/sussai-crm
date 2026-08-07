import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  MinLength,
} from 'class-validator';
import { UserProfile } from '@prisma/client';

export class CreateUserDto {
  @IsNotEmpty()
  nome!: string;

  @IsEmail()
  email!: string;

  @MinLength(6)
  senha!: string;

  @IsOptional()
  @IsEnum(UserProfile)
  perfil?: UserProfile;
}
