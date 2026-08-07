import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCentroCustoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nome!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  codigo?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  descricao?: string | null;
}
