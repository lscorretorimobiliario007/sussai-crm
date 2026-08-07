import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { StatusContrato, TipoContrato } from '@prisma/client';

export class QueryContratoDto {
  @IsOptional()
  @IsEnum(StatusContrato)
  status?: StatusContrato;

  @IsOptional()
  @IsEnum(TipoContrato)
  tipo?: TipoContrato;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
