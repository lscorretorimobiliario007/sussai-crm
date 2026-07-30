import { Router } from "express";
import {
  atualizarCorretor,
  buscarCorretor,
  criarCorretor,
  criarEquipe,
  dashboardCorretores,
  listarCorretores,
  listarEquipes,
  listarOpcoesCorretor,
  obterFotoCorretor,
  rankingCorretores,
  uploadCorretorFoto,
  uploadFotoCorretor,
} from "../controllers/corretorController.js";
import { authMiddleware } from "../middleware/auth.js";
import { validateIdParam } from "../middleware/validateId.js";

const router = Router();
router.param("id", validateIdParam);
router.use(authMiddleware);

router.get("/opcoes", listarOpcoesCorretor);
router.get("/dashboard", dashboardCorretores);
router.get("/ranking", rankingCorretores);
router.get("/equipes", listarEquipes);
router.post("/equipes", criarEquipe);

router.post("/", criarCorretor);
router.get("/", listarCorretores);
router.get("/:id", buscarCorretor);
router.put("/:id", atualizarCorretor);
router.post("/:id/foto", uploadCorretorFoto, uploadFotoCorretor);
router.get("/:id/foto/arquivo", obterFotoCorretor);

export default router;
