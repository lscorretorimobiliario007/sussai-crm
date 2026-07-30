import { UserProfile } from '@prisma/client';

export type JwtPayload = {
  id: number;
  empresaId: number;
  perfil: UserProfile;
  email: string;
};

export type AuthUser = JwtPayload & {
  nome: string;
};
