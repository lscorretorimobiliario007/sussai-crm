import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";
import { DEMO_EMAIL, ensureDemoEnvironment } from "../services/demoSeed.js";
import { sendControllerError } from "../utils/security.js";

function issueDemoToken(usuario, empresa) {
  const token = jwt.sign(
    { id: usuario.id, empresaId: empresa.id, tipo: usuario.tipo },
    process.env.JWT_SECRET,
    { expiresIn: "8h" },
  );
  return {
    mensagem: "Ambiente de demonstração pronto",
    token,
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      tipo: usuario.tipo,
      empresaId: empresa.id,
      empresaNome: empresa.nome,
      plano: empresa.plano,
      demo: true,
    },
    demo: true,
  };
}

export async function entrarDemo(req, res) {
  try {
    const reset = req.body?.reset === true;
    const result = await ensureDemoEnvironment({ reset });
    return res.json({
      ...issueDemoToken(result.admin, result.empresa),
      seeded: result.seeded,
      reset: result.reset,
      resumo: result.resumo || null,
    });
  } catch (error) {
    return sendControllerError(res, error, "Erro ao preparar demonstração");
  }
}

export async function resetarDemo(req, res) {
  try {
    const usuarioDb = await prisma.usuario.findFirst({
      where: { id: req.usuario.id, empresaId: req.usuario.empresaId },
      select: { id: true, email: true, tipo: true },
    });
    if (!usuarioDb || usuarioDb.email !== DEMO_EMAIL) {
      return res.status(403).json({ erro: "Reinício disponível apenas na conta demo@sussai.com.br" });
    }
    const result = await ensureDemoEnvironment({ reset: true });
    return res.json({
      ...issueDemoToken(result.admin, result.empresa),
      seeded: true,
      reset: true,
      resumo: result.resumo,
      mensagem: "Dados de demonstração reiniciados com sucesso",
    });
  } catch (error) {
    return sendControllerError(res, error, "Erro ao reiniciar demonstração");
  }
}
