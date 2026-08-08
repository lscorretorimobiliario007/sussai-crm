import {
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UserProfile } from '@prisma/client';

export class CreateUserDto {
  @IsNotEmpty()
  nome!: string;

  @IsEmail()
  email!: string;

  @MinLength(6)
  senha!: string;

  /** Ignored for privilege escalation; forced from JWT empresaId. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  empresaId?: number;

  @IsOptional()
  @IsEnum(UserProfile)
  perfil?: UserProfile;
}
