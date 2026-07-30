import prisma from "../config/prisma.js";
import { ownershipScope } from "../utils/helpers.js";

export async function ensureLeadAccess(req, res, next) {
  try {
    const lead = await prisma.lead.findFirst({
      where: {
        id: Number(req.params.id),
        ...ownershipScope(req),
      },
      select: { id: true, empresaId: true, ativo: true },
    });

    if (!lead) {
      return res.status(404).json({ erro: "Lead não encontrado" });
    }

    req.lead = lead;
    return next();
  } catch (error) {
    return next(error);
  }
}

export async function ensureActiveLeadAccess(req, res, next) {
  try {
    const lead = await prisma.lead.findFirst({
      where: {
        id: Number(req.params.id),
        ativo: true,
        ...ownershipScope(req),
      },
      select: { id: true, empresaId: true, ativo: true },
    });

    if (!lead) {
      return res.status(404).json({ erro: "Lead não encontrado" });
    }

    req.lead = lead;
    return next();
  } catch (error) {
    return next(error);
  }
}
