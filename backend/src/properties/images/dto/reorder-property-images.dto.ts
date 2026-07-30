import { Type } from 'class-transformer';
import { ArrayMinSize, ArrayUnique, IsArray, IsInt, Min } from 'class-validator';

export class ReorderPropertyImagesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  imageIds!: number[];
}
