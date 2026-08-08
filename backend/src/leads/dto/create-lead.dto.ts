import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { LeadOrigem, LeadStatus } from '@prisma/client';

const emptyToUndefined = ({ value }: { value: unknown }) =>
  value === '' || value === null ? undefined : value;

const toNullableInt = ({ value }: { value: unknown }) => {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : value;
};

const toNullableNumber = ({ value }: { value: unknown }) => {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : value;
};

export class CreateLeadDto {
  @IsOptional()
  @Transform(toNullableInt)
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsInt()
  @Min(1)
  propertyId?: number | null;

  @IsOptional()
  @Transform(toNullableInt)
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsInt()
  @Min(1)
  imovelId?: number | null;

  @IsOptional()
  @Transform(toNullableInt)
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsInt()
  @Min(1)
  assignedUserId?: number | null;

  @IsOptional()
  @Transform(toNullableInt)
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsInt()
  @Min(1)
  corretorId?: number | null;

  @IsOptional()
  @Transform(toNullableInt)
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsInt()
  @Min(1)
  etapaId?: number | null;

  @IsOptional()
  @Transform(toNullableInt)
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsInt()
  @Min(1)
  clienteId?: number | null;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  nome?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  titulo?: string;

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
  @Transform(emptyToUndefined)
  @IsEnum(LeadOrigem)
  origem?: LeadOrigem;

  @IsOptional()
  @Transform(emptyToUndefined)
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
  @IsString()
  @MaxLength(5000)
  notas?: string | null;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsDateString()
  ultimoContatoEm?: string | null;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsDateString()
  previsaoFechamento?: string | null;

  @IsOptional()
  @Transform(toNullableNumber)
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsNumber()
  valor?: number | null;

  @IsOptional()
  @Transform(toNullableNumber)
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsNumber()
  valorPrevisto?: number | null;

  @IsOptional()
  @Transform(toNullableInt)
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsInt()
  @Min(0)
  @Max(100)
  probabilidade?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  motivoPerda?: string | null;
}
