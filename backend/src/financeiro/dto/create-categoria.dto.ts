import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { TipoCategoriaFinanceira } from '@prisma/client';

export class CreateCategoriaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nome!: string;

  @IsEnum(TipoCategoriaFinanceira)
  tipo!: TipoCategoriaFinanceira;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  codigo?: string | null;
}
