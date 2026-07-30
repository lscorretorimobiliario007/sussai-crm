import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { LeadOrigem, LeadStatus } from '@prisma/client';

export class CreateLeadDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  propertyId?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  assignedUserId?: number | null;

  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  nome!: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @IsEmail({}, { message: 'Informe um e-mail válido' })
  @MaxLength(160)
  email?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  telefone?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  whatsapp?: string | null;

  @IsOptional()
  @IsEnum(LeadOrigem)
  origem?: LeadOrigem;

  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  mensagem?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  observacoes?: string | null;

  @IsOptional()
  @IsDateString()
  ultimoContatoEm?: string | null;
}
