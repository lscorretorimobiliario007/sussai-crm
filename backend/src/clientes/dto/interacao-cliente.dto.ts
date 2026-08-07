import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { TipoInteracaoCliente } from '@prisma/client';

export class InteracaoClienteDto {
  @IsEnum(TipoInteracaoCliente)
  tipo!: TipoInteracaoCliente;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  titulo!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  descricao?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @Type(() => Number)
  @IsInt()
  @Min(1)
  imovelId?: number | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @Type(() => Number)
  @IsInt()
  @Min(1)
  propertyId?: number | null;

  @IsOptional()
  @IsDateString()
  dataHora?: string;
}
