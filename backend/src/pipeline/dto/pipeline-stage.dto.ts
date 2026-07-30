import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePipelineStageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  nome!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  ordem?: number;

  @IsOptional()
  @IsString()
  @Matches(/^#([0-9A-Fa-f]{6})$/, {
    message: 'Cor deve estar no formato hexadecimal #RRGGBB',
  })
  cor?: string;
}

export class UpdatePipelineStageDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  nome?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  ordem?: number;

  @IsOptional()
  @IsString()
  @Matches(/^#([0-9A-Fa-f]{6})$/, {
    message: 'Cor deve estar no formato hexadecimal #RRGGBB',
  })
  cor?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
