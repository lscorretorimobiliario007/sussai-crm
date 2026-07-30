import prisma from "../config/prisma.js";
import { ownershipScope } from "../utils/helpers.js";

export async function ensureClienteAccess(req, res, next) {
  try {
    const cliente = await prisma.cliente.findFirst({
      where: {
        id: Number(req.params.id),
        ...ownershipScope(req),
      },
      select: { id: true, empresaId: true, ativo: true, corretorId: true },
    });
    if (!cliente) return res.status(404).json({ erro: "Cliente não encontrado" });
    req.cliente = cliente;
    return next();
  } catch (error) {
    return next(error);
  }
}

export async function ensureActiveClienteAccess(req, res, next) {
  try {
    const cliente = await prisma.cliente.findFirst({
      where: {
        id: Number(req.params.id),
        ativo: true,
        ...ownershipScope(req),
      },
      select: { id: true, empresaId: true, ativo: true, corretorId: true },
    });
    if (!cliente) return res.status(404).json({ erro: "Cliente não encontrado" });
    req.cliente = cliente;
    return next();
  } catch (error) {
    return next(error);
  }
}
