import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCaixaDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  saldoInicial?: number;

  @IsOptional()
  @IsDateString()
  data?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  observacoes?: string | null;
}
