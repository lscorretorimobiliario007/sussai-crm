import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class CreateConciliacaoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  titulo!: string;

  @IsDateString()
  periodoInicio!: string;

  @IsDateString()
  periodoFim!: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== '')
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  saldoExtrato?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  observacoes?: string | null;
}
