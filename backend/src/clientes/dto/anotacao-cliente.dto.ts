import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AnotacaoClienteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  conteudo!: string;
}
