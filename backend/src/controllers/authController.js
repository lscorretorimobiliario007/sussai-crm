import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";
import { isStrongEnoughPassword, normalizeEmail, sendControllerError } from "../utils/security.js";

const TIPOS_USUARIO = new Set(["ADMIN", "GERENTE", "CORRETOR"]);

export async function registrarEmpresa(req, res) {
  try {
    if (process.env.ALLOW_PUBLIC_SIGNUP === "false") {
      return res.status(403).json({ erro: "Cadastro público desabilitado. Contate o administrador." });
    }
    const { empresaNome, empresaCnpj, empresaEmail, empresaTelefone, nome, senha } = req.body;
    const email = normalizeEmail(req.body.email);

    if (!empresaNome || !empresaEmail || !nome || !email || !senha) {
      return res.status(400).json({ erro: "Preencha todos os campos obrigatórios" });
    }

    if (!isStrongEnoughPassword(senha)) {
      return res.status(400).json({ erro: "A senha deve ter pelo menos 8 caracteres" });
    }

    const emailExiste = await prisma.usuario.findUnique({ where: { email } });
    if (emailExiste) {
      return res.status(400).json({ erro: "E-mail já cadastrado" });
    }

    const senhaHash = await bcrypt.hash(senha, 12);

    const resultado = await prisma.$transaction(async (tx) => {
      const empresa = await tx.empresa.create({
        data: {
          nome: empresaNome,
          cnpj: empresaCnpj || null,
          email: empresaEmail,
          telefone: empresaTelefone || null,
        },
      });

      const usuario = await tx.usuario.create({
        data: {
          empresaId: empresa.id,
          nome,
          email,
          senha: senhaHash,
          tipo: "ADMIN",
        },
      });

      return { empresa, usuario };
    });

    const token = jwt.sign(
      {
        id: resultado.usuario.id,
        empresaId: resultado.empresa.id,
        tipo: resultado.usuario.tipo,
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.status(201).json({
      mensagem: "Empresa registrada com sucesso!",
      token,
      usuario: {
        id: resultado.usuario.id,
        nome: resultado.usuario.nome,
        email: resultado.usuario.email,
        tipo: resultado.usuario.tipo,
        empresaId: resultado.empresa.id,
        empresaNome: resultado.empresa.nome,
      },
    });
  } catch (error) {
    return sendControllerError(res, error, "Erro ao registrar empresa");
  }
}

export async function login(req, res) {
  try {
    const email = normalizeEmail(req.body.email);
    const { senha } = req.body;

    if (!email || typeof senha !== "string") {
      return res.status(400).json({ erro: "Informe e-mail e senha" });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { email },
      select: {
        id: true,
        nome: true,
        email: true,
        senha: true,
        tipo: true,
        ativo: true,
        empresaId: true,
        empresa: {
          select: { nome: true, nomeFantasia: true, plano: true, ativo: true },
        },
      },
    });

    if (!usuario || !usuario.ativo) {
      return res.status(401).json({ erro: "E-mail ou senha inválidos" });
    }

    if (!usuario.empresa.ativo) {
      return res.status(403).json({ erro: "Empresa inativa. Entre em contato com o suporte." });
    }

    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
    if (!senhaCorreta) {
      return res.status(401).json({ erro: "E-mail ou senha inválidos" });
    }

    const token = jwt.sign(
      {
        id: usuario.id,
        empresaId: usuario.empresaId,
        tipo: usuario.tipo,
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.json({
      mensagem: "Login realizado com sucesso",
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        tipo: usuario.tipo,
        empresaId: usuario.empresaId,
        empresaNome: usuario.empresa.nomeFantasia || usuario.empresa.nome,
        plano: usuario.empresa.plano,
        demo: usuario.email === "demo@sussai.com.br",
      },
    });
  } catch (error) {
    return sendControllerError(res, error, "Erro interno do servidor");
  }
}

export async function perfil(req, res) {
  try {
    const usuario = await prisma.usuario.findFirst({
      where: { id: req.usuario.id, empresaId: req.usuario.empresaId },
      select: {
        id: true,
        nome: true,
        email: true,
        tipo: true,
        telefone: true,
        empresa: {
          select: {
            id: true,
            nome: true,
            nomeFantasia: true,
            email: true,
            telefone: true,
            whatsapp: true,
            plano: true,
            cnpj: true,
            creci: true,
            slogan: true,
            logoUrl: true,
            corPrimaria: true,
            corSecundaria: true,
          },
        },
      },
    });

    return res.json(usuario);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao buscar perfil");
  }
}

export async function criarUsuario(req, res) {
  try {
    const { nome, senha, tipo, telefone } = req.body;
    const email = normalizeEmail(req.body.email);

    if (!nome || !email || !isStrongEnoughPassword(senha)) {
      return res.status(400).json({ erro: "Nome, e-mail e senha de 8 caracteres são obrigatórios" });
    }

    if (tipo && !TIPOS_USUARIO.has(tipo)) {
      return res.status(400).json({ erro: "Tipo de usuário inválido" });
    }

    const existe = await prisma.usuario.findUnique({ where: { email } });
    if (existe) {
      return res.status(400).json({ erro: "E-mail já cadastrado" });
    }

    const senhaHash = await bcrypt.hash(senha, 12);

    const usuario = await prisma.usuario.create({
      data: {
        empresaId: req.usuario.empresaId,
        nome,
        email,
        senha: senhaHash,
        tipo: tipo || "CORRETOR",
        telefone,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        tipo: true,
        telefone: true,
        ativo: true,
        createdAt: true,
      },
    });

    return res.status(201).json(usuario);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao criar usuário");
  }
}

export async function listarUsuarios(req, res) {
  try {
    const usuarios = await prisma.usuario.findMany({
      where: { empresaId: req.usuario.empresaId },
      select: {
        id: true,
        nome: true,
        email: true,
        tipo: true,
        telefone: true,
        ativo: true,
        createdAt: true,
      },
      orderBy: { nome: "asc" },
      take: 500,
    });

    return res.json(usuarios);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao listar usuários");
  }
}
