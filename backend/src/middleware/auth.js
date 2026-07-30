import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";

export async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ erro: "Token não fornecido" });
  }

  const token = authHeader.split(" ")[1];

  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET não configurado");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });

    if (!decoded.id || !decoded.empresaId || !decoded.tipo) {
      return res.status(401).json({ erro: "Token inválido ou expirado" });
    }

    const usuario = await prisma.usuario.findFirst({
      where: {
        id: decoded.id,
        empresaId: decoded.empresaId,
        ativo: true,
        empresa: { ativo: true },
      },
      select: { id: true, empresaId: true, tipo: true },
    });

    if (!usuario) {
      return res.status(401).json({ erro: "Usuário ou empresa inativos" });
    }

    req.usuario = usuario;
    next();
  } catch {
    return res.status(401).json({ erro: "Token inválido ou expirado" });
  }
}

export function adminOnly(req, res, next) {
  if (req.usuario.tipo !== "ADMIN") {
    return res.status(403).json({ erro: "Acesso restrito a administradores" });
  }
  next();
}

export function rolesAllowed(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.usuario.tipo)) {
      return res.status(403).json({ erro: "Você não tem permissão para esta ação" });
    }
    next();
  };
}
