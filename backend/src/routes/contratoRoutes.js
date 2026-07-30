import { Router } from "express";
import {
  criarContrato,
  listarContratos,
  buscarContrato,
  atualizarContrato,
} from "../controllers/contratoController.js";
import { authMiddleware } from "../middleware/auth.js";
import { validateIdParam } from "../middleware/validateId.js";

const router = Router();

router.param("id", validateIdParam);
router.use(authMiddleware);

router.post("/", criarContrato);
router.get("/", listarContratos);
router.get("/:id", buscarContrato);
router.put("/:id", atualizarContrato);

export default router;
