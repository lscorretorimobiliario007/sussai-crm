import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class MoveLeadDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  stageId!: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  observacao?: string;
}
