import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { FinalidadeImovel, TipoImovel } from '@prisma/client';

export class CreatePropertyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  titulo!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  descricao?: string;

  @IsEnum(FinalidadeImovel)
  finalidade!: FinalidadeImovel;

  @IsEnum(TipoImovel)
  tipo!: TipoImovel;

  @ValidateIf((o: CreatePropertyDto) => o.finalidade === FinalidadeImovel.VENDA)
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'Informe o valor de venda' })
  valorVenda?: number | null;

  @ValidateIf((o: CreatePropertyDto) => o.finalidade === FinalidadeImovel.LOCACAO)
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'Informe o valor de locação' })
  valorLocacao?: number | null;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  endereco!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  numero?: string | null;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  bairro!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  cidade!: string;

  @IsString()
  @Length(2, 2)
  estado!: string;

  @IsOptional()
  @IsString()
  @MaxLength(12)
  cep?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  quartos?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  banheiros?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  suites?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  vagas?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  areaTerreno?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  areaConstruida?: number | null;

  @IsOptional()
  @IsBoolean()
  destaque?: boolean;

  @IsOptional()
  @IsBoolean()
  publicado?: boolean;
}
