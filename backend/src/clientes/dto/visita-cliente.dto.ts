import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { StatusVisitaCliente } from '@prisma/client';

export class VisitaClienteDto {
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @Type(() => Number)
  @IsInt()
  @Min(1)
  imovelId?: number;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @Type(() => Number)
  @IsInt()
  @Min(1)
  propertyId?: number;

  @IsDateString()
  dataHora!: string;

  @IsOptional()
  @IsEnum(StatusVisitaCliente)
  status?: StatusVisitaCliente;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  observacoes?: string | null;
}
