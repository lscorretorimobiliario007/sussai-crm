import { Router } from "express";
import {
  criarCliente,
  listarClientes,
  listarOpcoesCliente,
  buscarCliente,
  atualizarCliente,
  excluirCliente,
  reativarCliente,
  listarHistoricoCliente,
  criarAnotacao,
  criarInteracao,
  sincronizarContatos,
  uploadAvatar,
  obterAvatar,
  adicionarDocumentos,
  obterDocumento,
  excluirDocumento,
  adicionarFavorito,
  removerFavorito,
  criarVisita,
  criarProposta,
  compartilharCliente,
  buscarClienteCompartilhado,
  exportarClientePdf,
  exportarClientesExcel,
} from "../controllers/clienteController.js";
import { authMiddleware } from "../middleware/auth.js";
import { ensureActiveClienteAccess, ensureClienteAccess } from "../middleware/clienteAccess.js";
import { uploadClienteAvatar, uploadClienteDocumentos } from "../middleware/clienteUpload.js";
import { validateIdParam } from "../middleware/validateId.js";

const router = Router();

router.param("id", validateIdParam);
router.param("documentoId", validateIdParam);
router.param("imovelId", validateIdParam);
router.use(authMiddleware);

router.post("/", criarCliente);
router.get("/", listarClientes);
router.get("/opcoes", listarOpcoesCliente);
router.get("/export/excel", exportarClientesExcel);
router.get("/compartilhado/:token", buscarClienteCompartilhado);

router.put("/:id/contatos", ensureActiveClienteAccess, sincronizarContatos);
router.post("/:id/anotacoes", ensureActiveClienteAccess, criarAnotacao);
router.post("/:id/interacoes", ensureActiveClienteAccess, criarInteracao);
router.post("/:id/avatar", ensureActiveClienteAccess, uploadClienteAvatar, uploadAvatar);
router.get("/:id/avatar/arquivo", ensureClienteAccess, obterAvatar);
router.post("/:id/documentos", ensureActiveClienteAccess, uploadClienteDocumentos, adicionarDocumentos);
router.get("/:id/documentos/:documentoId/arquivo", ensureClienteAccess, obterDocumento);
router.delete("/:id/documentos/:documentoId", ensureActiveClienteAccess, excluirDocumento);
router.post("/:id/favoritos", ensureActiveClienteAccess, adicionarFavorito);
router.delete("/:id/favoritos/:imovelId", ensureActiveClienteAccess, removerFavorito);
router.post("/:id/visitas", ensureActiveClienteAccess, criarVisita);
router.post("/:id/propostas", ensureActiveClienteAccess, criarProposta);
router.post("/:id/compartilhar", ensureActiveClienteAccess, compartilharCliente);
router.get("/:id/historico", ensureClienteAccess, listarHistoricoCliente);
router.get("/:id/export/pdf", ensureClienteAccess, exportarClientePdf);
router.post("/:id/reativar", reativarCliente);
router.get("/:id", buscarCliente);
router.put("/:id", atualizarCliente);
router.delete("/:id", excluirCliente);

export default router;
