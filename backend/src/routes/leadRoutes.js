import { Router } from "express";
import {
  adicionarAnexos,
  atualizarEtapa,
  atualizarLead,
  buscarLead,
  criarAgendaLead,
  criarComentario,
  criarEtapa,
  criarLead,
  criarTarefaLead,
  dashboardPipeline,
  excluirAnexo,
  excluirLead,
  listarEtapas,
  listarHistoricoLead,
  listarLeads,
  listarOpcoesLead,
  moverLead,
  obterAnexo,
  reordenarEtapas,
} from "../controllers/leadController.js";
import { authMiddleware } from "../middleware/auth.js";
import { ensureActiveLeadAccess, ensureLeadAccess } from "../middleware/leadAccess.js";
import { uploadLeadAnexos } from "../middleware/leadUpload.js";
import { validateIdParam } from "../middleware/validateId.js";

const router = Router();

router.param("id", validateIdParam);
router.param("etapaId", validateIdParam);
router.param("anexoId", validateIdParam);
router.use(authMiddleware);

router.get("/opcoes", listarOpcoesLead);
router.get("/dashboard", dashboardPipeline);
router.get("/etapas", listarEtapas);
router.post("/etapas", criarEtapa);
router.put("/etapas/ordem", reordenarEtapas);
router.put("/etapas/:etapaId", atualizarEtapa);

router.post("/", criarLead);
router.get("/", listarLeads);
router.get("/:id", buscarLead);
router.put("/:id", atualizarLead);
router.patch("/:id/mover", moverLead);
router.delete("/:id", excluirLead);

router.get("/:id/historico", listarHistoricoLead);
router.post("/:id/comentarios", criarComentario);
router.post("/:id/anexos", ensureActiveLeadAccess, uploadLeadAnexos, adicionarAnexos);
router.get("/:id/anexos/:anexoId/arquivo", ensureLeadAccess, obterAnexo);
router.delete("/:id/anexos/:anexoId", ensureActiveLeadAccess, excluirAnexo);
router.post("/:id/tarefas", criarTarefaLead);
router.post("/:id/agenda", criarAgendaLead);

export default router;
