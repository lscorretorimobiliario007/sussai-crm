import { PartialType, OmitType } from '@nestjs/mapped-types';
import { IsOptional, MinLength } from 'class-validator';
import { CreateCorretorDto } from './create-corretor.dto';

export class UpdateCorretorDto extends PartialType(
  OmitType(CreateCorretorDto, ['senha'] as const),
) {
  @IsOptional()
  @MinLength(8)
  senha?: string;
}
