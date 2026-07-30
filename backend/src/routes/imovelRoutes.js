import { Router } from "express";
import {
  criarImovel,
  listarImoveis,
  buscarImovel,
  atualizarImovel,
  excluirImovel,
  reativarImovel,
  listarOpcoesImovel,
  adicionarFotos,
  obterArquivoFoto,
  definirFotoPrincipal,
  excluirFoto,
  reordenarFotos,
  listarHistoricoImovel,
  listarHistoricoChavesImovel,
} from "../controllers/imovelController.js";
import { authMiddleware } from "../middleware/auth.js";
import { ensureActiveImovelAccess, ensureImovelAccess } from "../middleware/imovelAccess.js";
import { uploadImovelFotos } from "../middleware/imovelUpload.js";
import { validateIdParam } from "../middleware/validateId.js";

const router = Router();

router.param("id", validateIdParam);
router.param("fotoId", validateIdParam);
router.use(authMiddleware);

router.post("/", criarImovel);
router.get("/", listarImoveis);
router.get("/opcoes", listarOpcoesImovel);
router.post("/:id/fotos", ensureActiveImovelAccess, uploadImovelFotos, adicionarFotos);
router.put("/:id/fotos/ordem", ensureActiveImovelAccess, reordenarFotos);
router.get("/:id/fotos/:fotoId/arquivo", ensureImovelAccess, obterArquivoFoto);
router.patch("/:id/fotos/:fotoId/principal", ensureActiveImovelAccess, definirFotoPrincipal);
router.delete("/:id/fotos/:fotoId", ensureActiveImovelAccess, excluirFoto);
router.get("/:id/historico", ensureImovelAccess, listarHistoricoImovel);
router.get("/:id/chaves/historico", ensureImovelAccess, listarHistoricoChavesImovel);
router.post("/:id/reativar", reativarImovel);
router.get("/:id", buscarImovel);
router.put("/:id", atualizarImovel);
router.delete("/:id", excluirImovel);

export default router;
