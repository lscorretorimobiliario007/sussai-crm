import { Router } from "express";
import {
  criarTarefa,
  listarTarefas,
  atualizarTarefa,
  excluirTarefa,
} from "../controllers/tarefaController.js";
import { authMiddleware } from "../middleware/auth.js";
import { validateIdParam } from "../middleware/validateId.js";

const router = Router();

router.param("id", validateIdParam);
router.use(authMiddleware);

router.post("/", criarTarefa);
router.get("/", listarTarefas);
router.put("/:id", atualizarTarefa);
router.delete("/:id", excluirTarefa);

export default router;
