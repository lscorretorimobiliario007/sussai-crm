import { randomUUID } from "node:crypto";

export function empresaScope(req) {
  return { empresaId: req.usuario.empresaId };
}

export function ownershipScope(req, ownerField = "corretorId") {
  return {
    ...empresaScope(req),
    ...(req.usuario.tipo === "CORRETOR" && { [ownerField]: req.usuario.id }),
  };
}

export function gerarCodigoImovel() {
  const uniquePart = `${Date.now().toString(36)}${randomUUID().slice(0, 4)}`.toUpperCase();
  return `IMV-${uniquePart}`;
}

export function gerarNumeroContrato() {
  const ano = new Date().getFullYear();
  const uniquePart = `${Date.now().toString(36)}${randomUUID().slice(0, 4)}`.toUpperCase();
  return `CTR-${ano}-${uniquePart}`;
}
