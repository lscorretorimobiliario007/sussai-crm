import { PartialType } from '@nestjs/mapped-types';
import { CreatePropertyOwnerDto } from './create-property-owner.dto';

export class UpdatePropertyOwnerDto extends PartialType(
  CreatePropertyOwnerDto,
) {}
