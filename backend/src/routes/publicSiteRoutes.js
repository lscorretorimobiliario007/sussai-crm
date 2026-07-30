import { Router } from "express";
import {
  buscarImovelPublico,
  criarLeadPublico,
  dadosEmpresaPublica,
  listarCorretoresPublicos,
  listarImoveisPublicos,
  obterAssetEmpresaPublico,
  obterFotoPublica,
  publicLeadLimit,
  publicReadLimit,
} from "../controllers/publicSiteController.js";

const router = Router();

router.get("/empresa", publicReadLimit, dadosEmpresaPublica);
router.get("/empresa/logo", publicReadLimit, (req, res, next) => {
  req.params.kind = "logo";
  return obterAssetEmpresaPublico(req, res, next);
});
router.get("/empresa/favicon", publicReadLimit, (req, res, next) => {
  req.params.kind = "favicon";
  return obterAssetEmpresaPublico(req, res, next);
});
router.get("/imoveis", publicReadLimit, listarImoveisPublicos);
router.get("/imoveis/:slugOrCodigo", publicReadLimit, buscarImovelPublico);
router.get("/imoveis/:id/fotos/:fotoId", publicReadLimit, obterFotoPublica);
router.get("/corretores", publicReadLimit, listarCorretoresPublicos);
router.post("/leads", publicLeadLimit, criarLeadPublico);

export default router;
