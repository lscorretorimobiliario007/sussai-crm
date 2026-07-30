import { Router } from "express";
import {
  atualizarProprietario,
  buscarProprietario,
  criarAnotacaoProprietario,
  criarProprietario,
  dashboardProprietario,
  excluirProprietario,
  listarOpcoesProprietario,
  listarProprietarios,
  reativarProprietario,
  sincronizarDadosBancarios,
} from "../controllers/proprietarioController.js";
import { authMiddleware } from "../middleware/auth.js";
import { validateIdParam } from "../middleware/validateId.js";

const router = Router();
router.param("id", validateIdParam);
router.use(authMiddleware);

router.get("/opcoes", listarOpcoesProprietario);
router.get("/dashboard", dashboardProprietario);
router.post("/", criarProprietario);
router.get("/", listarProprietarios);
router.get("/:id", buscarProprietario);
router.put("/:id", atualizarProprietario);
router.delete("/:id", excluirProprietario);
router.post("/:id/reativar", reativarProprietario);
router.put("/:id/dados-bancarios", sincronizarDadosBancarios);
router.post("/:id/anotacoes", criarAnotacaoProprietario);

export default router;
