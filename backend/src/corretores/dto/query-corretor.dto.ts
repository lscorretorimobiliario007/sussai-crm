import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { StatusCorretor } from '@prisma/client';

export class QueryCorretorDto {
  @IsOptional()
  @IsString()
  busca?: string;

  @IsOptional()
  @IsEnum(StatusCorretor)
  statusCorretor?: StatusCorretor;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  equipeId?: number;

  @IsOptional()
  @IsString()
  ativo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 12;
}
