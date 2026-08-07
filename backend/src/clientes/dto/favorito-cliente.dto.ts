import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min, ValidateIf } from 'class-validator';

export class FavoritoClienteDto {
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @Type(() => Number)
  @IsInt()
  @Min(1)
  imovelId?: number;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @Type(() => Number)
  @IsInt()
  @Min(1)
  propertyId?: number;
}
