import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import multer from "multer";
import prisma from "../config/prisma.js";
import {
  ALLOWED_IMAGE_TYPES,
  EMPRESA_UPLOAD_ROOT,
  MAX_IMAGE_SIZE,
} from "../config/uploads.js";
import { sendControllerError } from "../utils/security.js";

const EMPRESA_FIELDS = [
  "nome",
  "nomeFantasia",
  "cnpj",
  "creci",
  "email",
  "telefone",
  "whatsapp",
  "siteUrl",
  "slogan",
  "corPrimaria",
  "corSecundaria",
  "endereco",
  "numero",
  "complemento",
  "bairro",
  "cidade",
  "estado",
  "cep",
  "instagram",
  "facebook",
  "linkedin",
  "youtube",
  "horarioAtendimento",
  "googleMapsUrl",
  "latitude",
  "longitude",
  "siteTitulo",
  "siteDescricao",
  "seoKeywords",
  "siteAtivo",
  "siteExibirCorretores",
  "siteExibirBlog",
];

const HEX_COLOR = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

function pickEmpresaData(body) {
  const data = {};
  for (const key of EMPRESA_FIELDS) {
    if (body[key] === undefined) continue;
    data[key] = body[key];
  }
  return data;
}

function normalizeEmpresaPayload(raw) {
  const data = pickEmpresaData(raw);

  for (const key of Object.keys(data)) {
    if (typeof data[key] === "string") {
      data[key] = data[key].trim();
      if (data[key] === "") data[key] = null;
    }
  }

  if (data.email != null) data.email = String(data.email).toLowerCase();
  if (data.estado != null) data.estado = String(data.estado).toUpperCase().slice(0, 2);

  for (const boolKey of ["siteAtivo", "siteExibirCorretores", "siteExibirBlog"]) {
    if (data[boolKey] !== undefined) {
      data[boolKey] = data[boolKey] === true || data[boolKey] === "true";
    }
  }

  for (const numKey of ["latitude", "longitude"]) {
    if (data[numKey] === undefined || data[numKey] === null) continue;
    const n = Number(data[numKey]);
    if (!Number.isFinite(n)) return { error: `${numKey} inválido` };
    data[numKey] = n;
  }

  for (const colorKey of ["corPrimaria", "corSecundaria"]) {
    if (data[colorKey] == null) continue;
    if (!HEX_COLOR.test(data[colorKey])) return { error: `${colorKey} deve ser cor hexadecimal (#RRGGBB)` };
  }

  if (data.whatsapp != null) {
    data.whatsapp = String(data.whatsapp).replace(/\D/g, "") || null;
  }

  return { data };
}

export function sanitizeEmpresa(empresa) {
  if (!empresa) return null;
  return {
    id: empresa.id,
    nome: empresa.nome,
    nomeFantasia: empresa.nomeFantasia,
    cnpj: empresa.cnpj,
    creci: empresa.creci,
    email: empresa.email,
    telefone: empresa.telefone,
    whatsapp: empresa.whatsapp,
    siteUrl: empresa.siteUrl,
    slogan: empresa.slogan,
    logoUrl: empresa.logoUrl,
    faviconUrl: empresa.faviconUrl,
    corPrimaria: empresa.corPrimaria || "#0B1F3A",
    corSecundaria: empresa.corSecundaria || "#C9A227",
    endereco: empresa.endereco,
    numero: empresa.numero,
    complemento: empresa.complemento,
    bairro: empresa.bairro,
    cidade: empresa.cidade,
    estado: empresa.estado,
    cep: empresa.cep,
    instagram: empresa.instagram,
    facebook: empresa.facebook,
    linkedin: empresa.linkedin,
    youtube: empresa.youtube,
    horarioAtendimento: empresa.horarioAtendimento,
    googleMapsUrl: empresa.googleMapsUrl,
    latitude: empresa.latitude,
    longitude: empresa.longitude,
    siteTitulo: empresa.siteTitulo,
    siteDescricao: empresa.siteDescricao,
    seoKeywords: empresa.seoKeywords,
    siteAtivo: empresa.siteAtivo !== false,
    siteExibirCorretores: empresa.siteExibirCorretores !== false,
    siteExibirBlog: empresa.siteExibirBlog !== false,
    plano: empresa.plano,
    ativo: empresa.ativo,
    updatedAt: empresa.updatedAt,
  };
}

export async function obterEmpresa(req, res) {
  try {
    const empresa = await prisma.empresa.findFirst({
      where: { id: req.usuario.empresaId },
    });
    if (!empresa) return res.status(404).json({ erro: "Empresa não encontrada" });
    return res.json(sanitizeEmpresa(empresa));
  } catch (error) {
    return sendControllerError(res, error, "Erro ao carregar empresa");
  }
}

export async function atualizarEmpresa(req, res) {
  try {
    if (req.usuario.tipo !== "ADMIN") {
      return res.status(403).json({ erro: "Apenas administradores podem alterar a empresa" });
    }

    const built = normalizeEmpresaPayload(req.body || {});
    if (built.error) return res.status(400).json({ erro: built.error });
    if (built.data.nome !== undefined && (!built.data.nome || built.data.nome.length < 2)) {
      return res.status(400).json({ erro: "Nome da empresa é obrigatório" });
    }
    if (built.data.email != null && !built.data.email.includes("@")) {
      return res.status(400).json({ erro: "E-mail inválido" });
    }

    const updated = await prisma.empresa.updateMany({
      where: { id: req.usuario.empresaId },
      data: built.data,
    });
    if (!updated.count) return res.status(404).json({ erro: "Empresa não encontrada" });

    const empresa = await prisma.empresa.findFirst({ where: { id: req.usuario.empresaId } });
    return res.json(sanitizeEmpresa(empresa));
  } catch (error) {
    return sendControllerError(res, error, "Erro ao atualizar empresa");
  }
}

function makeAssetUploader(fieldName) {
  const storage = multer.diskStorage({
    destination(req, file, callback) {
      const directory = path.join(EMPRESA_UPLOAD_ROOT, String(req.usuario.empresaId));
      fs.mkdirSync(directory, { recursive: true });
      callback(null, directory);
    },
    filename(req, file, callback) {
      callback(null, `${fieldName}-${randomUUID()}${ALLOWED_IMAGE_TYPES.get(file.mimetype)}`);
    },
  });

  return multer({
    storage,
    limits: { files: 1, fileSize: MAX_IMAGE_SIZE },
    fileFilter(req, file, callback) {
      if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
        return callback(new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname));
      }
      return callback(null, true);
    },
  }).single(fieldName);
}

export const uploadEmpresaLogo = makeAssetUploader("logo");
export const uploadEmpresaFavicon = makeAssetUploader("favicon");

async function uploadEmpresaAsset(req, res, { field, arquivoKey, urlKey, publicPath }) {
  try {
    if (req.usuario.tipo !== "ADMIN") {
      return res.status(403).json({ erro: "Apenas administradores podem alterar a marca" });
    }
    if (!req.file) return res.status(400).json({ erro: `Selecione o arquivo de ${field}` });

    const previous = await prisma.empresa.findFirst({
      where: { id: req.usuario.empresaId },
      select: { id: true, [arquivoKey]: true },
    });
    if (!previous) return res.status(404).json({ erro: "Empresa não encontrada" });

    const empresa = await prisma.empresa.update({
      where: { id: req.usuario.empresaId },
      data: {
        [arquivoKey]: req.file.filename,
        [urlKey]: publicPath,
      },
    });

    if (previous[arquivoKey]) {
      const oldPath = path.join(EMPRESA_UPLOAD_ROOT, String(req.usuario.empresaId), previous[arquivoKey]);
      fs.promises.unlink(oldPath).catch(() => {});
    }

    return res.json(sanitizeEmpresa(empresa));
  } catch (error) {
    if (req.file?.path) fs.promises.unlink(req.file.path).catch(() => {});
    return sendControllerError(res, error, `Erro ao enviar ${field}`);
  }
}

export async function uploadLogo(req, res) {
  return uploadEmpresaAsset(req, res, {
    field: "logo",
    arquivoKey: "logoArquivo",
    urlKey: "logoUrl",
    publicPath: "/public/empresa/logo",
  });
}

export async function uploadFavicon(req, res) {
  return uploadEmpresaAsset(req, res, {
    field: "favicon",
    arquivoKey: "faviconArquivo",
    urlKey: "faviconUrl",
    publicPath: "/public/empresa/favicon",
  });
}

export async function servirArquivoEmpresaAutenticado(req, res, next, kind) {
  try {
    const empresa = await prisma.empresa.findFirst({
      where: { id: req.usuario.empresaId },
      select: { logoArquivo: true, faviconArquivo: true },
    });
    const filename = kind === "favicon" ? empresa?.faviconArquivo : empresa?.logoArquivo;
    if (!filename) return res.status(404).json({ erro: "Arquivo não encontrado" });
    const filePath = path.join(EMPRESA_UPLOAD_ROOT, String(req.usuario.empresaId), filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ erro: "Arquivo não encontrado" });
    return res.sendFile(filePath);
  } catch (error) {
    return next(error);
  }
}
