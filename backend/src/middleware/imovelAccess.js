import prisma from "../config/prisma.js";
import { ownershipScope } from "../utils/helpers.js";

export async function ensureImovelAccess(req, res, next) {
  try {
    const imovel = await prisma.imovel.findFirst({
      where: {
        id: Number(req.params.id),
        ...ownershipScope(req),
      },
      select: { id: true, empresaId: true, ativo: true },
    });

    if (!imovel) {
      return res.status(404).json({ erro: "Imóvel não encontrado" });
    }

    req.imovel = imovel;
    return next();
  } catch (error) {
    return next(error);
  }
}

export async function ensureActiveImovelAccess(req, res, next) {
  try {
    const imovel = await prisma.imovel.findFirst({
      where: {
        id: Number(req.params.id),
        ativo: true,
        ...ownershipScope(req),
      },
      select: { id: true, empresaId: true, ativo: true },
    });

    if (!imovel) {
      return res.status(404).json({ erro: "Imóvel não encontrado" });
    }

    req.imovel = imovel;
    return next();
  } catch (error) {
    return next(error);
  }
}
