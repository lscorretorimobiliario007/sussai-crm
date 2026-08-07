import { IsNotEmpty, IsString } from 'class-validator';

export class CreateEquipeDto {
  @IsNotEmpty()
  @IsString()
  nome!: string;
}
