import { Router } from "express";

import authRoutes from "./authRoutes.js";
import imovelRoutes from "./imovelRoutes.js";
import clienteRoutes from "./clienteRoutes.js";
import leadRoutes from "./leadRoutes.js";
import contratoRoutes from "./contratoRoutes.js";
import financeiroRoutes from "./financeiroRoutes.js";
import tarefaRoutes from "./tarefaRoutes.js";
import agendaRoutes from "./agendaRoutes.js";
import proprietarioRoutes from "./proprietarioRoutes.js";
import corretorRoutes from "./corretorRoutes.js";
import dashboardRoutes from "./dashboardRoutes.js";
import publicSiteRoutes from "./publicSiteRoutes.js";
import docsRoutes from "./docsRoutes.js";
import empresaRoutes from "./empresaRoutes.js";

const router = Router();

router.get("/", (req, res) => {
  res.json({
    sistema: "SUSSAI CRM",
    versao: "1.0.0-rc1",
    status: "ONLINE",
    descricao: "CRM Imobiliário Profissional Multi-tenant",
    docs: "/api/docs",
  });
});

router.use("/api/docs", docsRoutes);
router.use("/docs", docsRoutes);

router.use("/auth", authRoutes);
router.use("/empresa", empresaRoutes);
router.use("/public", publicSiteRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/imoveis", imovelRoutes);
router.use("/clientes", clienteRoutes);
router.use("/proprietarios", proprietarioRoutes);
router.use("/corretores", corretorRoutes);
router.use("/leads", leadRoutes);
router.use("/contratos", contratoRoutes);
router.use("/financeiro", financeiroRoutes);
router.use("/tarefas", tarefaRoutes);
router.use("/agenda", agendaRoutes);

export default router;
