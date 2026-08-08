import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class MoveLeadDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  stageId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  etapaId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  observacao?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  motivoPerda?: string;
}
