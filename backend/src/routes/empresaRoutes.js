import { Router } from "express";
import {
  atualizarEmpresa,
  obterEmpresa,
  servirArquivoEmpresaAutenticado,
  uploadEmpresaFavicon,
  uploadEmpresaLogo,
  uploadFavicon,
  uploadLogo,
} from "../controllers/empresaController.js";
import { authMiddleware, adminOnly } from "../middleware/auth.js";

const router = Router();

router.use(authMiddleware);

router.get("/", obterEmpresa);
router.put("/", adminOnly, atualizarEmpresa);
router.post("/logo", adminOnly, uploadEmpresaLogo, uploadLogo);
router.post("/favicon", adminOnly, uploadEmpresaFavicon, uploadFavicon);
router.get("/logo/arquivo", (req, res, next) => servirArquivoEmpresaAutenticado(req, res, next, "logo"));
router.get("/favicon/arquivo", (req, res, next) => servirArquivoEmpresaAutenticado(req, res, next, "favicon"));

export default router;
