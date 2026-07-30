import { FinalidadeImovel, TipoImovel } from '@prisma/client';

/** Referência tipada do model Property (fonte da verdade: prisma/schema.prisma). */
export type PropertyEntity = {
  id: number;
  codigo: string;
  titulo: string;
  descricao: string | null;
  finalidade: FinalidadeImovel;
  tipo: TipoImovel;
  valorVenda: number | null;
  valorLocacao: number | null;
  endereco: string;
  numero: string | null;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string | null;
  quartos: number;
  banheiros: number;
  suites: number;
  vagas: number;
  areaTerreno: number | null;
  areaConstruida: number | null;
  destaque: boolean;
  publicado: boolean;
  ativo: boolean;
  empresaId: number;
  createdAt: Date;
  updatedAt: Date;
};
