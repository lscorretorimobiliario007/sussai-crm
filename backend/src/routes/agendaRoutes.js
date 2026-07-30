import { Router } from "express";
import {
  atualizarEvento,
  buscarEvento,
  cancelarEvento,
  concluirEvento,
  criarEvento,
  dashboardAgenda,
  excluirEvento,
  listarEventos,
  listarNotificacoes,
  listarOpcoesAgenda,
  listarTimeline,
  marcarNotificacaoLida,
  marcarTodasNotificacoesLidas,
  reagendarEvento,
} from "../controllers/agendaController.js";
import { authMiddleware } from "../middleware/auth.js";
import { validateIdParam } from "../middleware/validateId.js";

const router = Router();

router.param("id", validateIdParam);
router.param("notificacaoId", validateIdParam);
router.use(authMiddleware);

router.get("/opcoes", listarOpcoesAgenda);
router.get("/dashboard", dashboardAgenda);
router.get("/timeline", listarTimeline);
router.get("/notificacoes", listarNotificacoes);
router.patch("/notificacoes/lidas", marcarTodasNotificacoesLidas);
router.patch("/notificacoes/:notificacaoId/lida", marcarNotificacaoLida);

router.post("/", criarEvento);
router.get("/", listarEventos);
router.get("/:id", buscarEvento);
router.put("/:id", atualizarEvento);
router.patch("/:id/reagendar", reagendarEvento);
router.patch("/:id/concluir", concluirEvento);
router.patch("/:id/cancelar", cancelarEvento);
router.delete("/:id", excluirEvento);

export default router;
