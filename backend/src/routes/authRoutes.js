import { Router } from "express";
import {
  registrarEmpresa,
  login,
  perfil,
  criarUsuario,
  listarUsuarios,
} from "../controllers/authController.js";
import { entrarDemo, resetarDemo } from "../controllers/demoController.js";
import { authMiddleware, adminOnly, rolesAllowed } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";

const router = Router();

const authAbuseLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, keyPrefix: "auth" });
const demoLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, keyPrefix: "demo" });

router.post("/registrar", authAbuseLimit, registrarEmpresa);
router.post("/login", authAbuseLimit, login);
router.post("/demo", demoLimit, entrarDemo);
router.post("/demo/reset", authMiddleware, demoLimit, resetarDemo);
router.get("/perfil", authMiddleware, perfil);
router.post("/usuarios", authMiddleware, adminOnly, criarUsuario);
router.get("/usuarios", authMiddleware, rolesAllowed("ADMIN", "GERENTE"), listarUsuarios);

export default router;
