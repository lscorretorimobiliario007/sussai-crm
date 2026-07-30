import prisma from "../config/prisma.js";
import { ownershipScope } from "../utils/helpers.js";

export async function ensureEventoAccess(req, res, next) {
  try {
    const evento = await prisma.eventoAgenda.findFirst({
      where: {
        id: Number(req.params.id),
        ativo: true,
        ...ownershipScope(req, "usuarioId"),
      },
      select: {
        id: true, empresaId: true, usuarioId: true, status: true,
        dataInicio: true, dataFim: true, tipo: true, titulo: true,
      },
    });
    if (!evento) return res.status(404).json({ erro: "Compromisso não encontrado" });
    req.evento = evento;
    return next();
  } catch (error) {
    return next(error);
  }
}
