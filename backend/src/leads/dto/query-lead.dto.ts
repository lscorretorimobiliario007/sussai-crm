import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { LeadOrigem, LeadStatus } from '@prisma/client';

export class QueryLeadDto {
  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  @IsOptional()
  @IsEnum(LeadOrigem)
  origem?: LeadOrigem;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  assignedUserId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  corretorId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  propertyId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  imovelId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  clienteId?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  busca?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number = 500;
}
