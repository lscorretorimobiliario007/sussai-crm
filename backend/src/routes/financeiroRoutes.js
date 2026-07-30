import { Router } from "express";
import {
  adicionarItemConciliacao,
  adicionarMovimentoCaixa,
  abrirCaixa,
  aprovarComissao,
  atualizarCategoria,
  atualizarCentroCusto,
  atualizarComissao,
  atualizarLancamento,
  buscarCaixa,
  buscarConciliacao,
  buscarLancamento,
  cancelarLancamento,
  criarCategoria,
  criarCentroCusto,
  criarCobranca,
  criarComissao,
  criarConciliacao,
  criarLancamento,
  dashboardFinanceiro,
  dreSimplificado,
  exportarExcel,
  exportarPdf,
  fecharCaixa,
  finalizarConciliacao,
  fluxoCaixa,
  gerarCobrancasMensais,
  gerarComissaoDeContrato,
  indicadoresFinanceiro,
  liquidarLancamento,
  listarCaixas,
  listarCategorias,
  listarCentrosCusto,
  listarCobrancas,
  listarComissoes,
  listarConciliacoes,
  listarLancamentos,
  listarOpcoesFinanceiro,
  pagarComissao,
  registrarPagamento,
  resumoFinanceiro,
} from "../controllers/financeiroController.js";
import { authMiddleware, rolesAllowed } from "../middleware/auth.js";
import { validateIdParam } from "../middleware/validateId.js";

const router = Router();

router.param("id", validateIdParam);
router.param("contratoId", validateIdParam);
router.use(authMiddleware);
router.use(rolesAllowed("ADMIN", "GERENTE"));

router.get("/opcoes", listarOpcoesFinanceiro);
router.get("/dashboard", dashboardFinanceiro);
router.get("/indicadores", indicadoresFinanceiro);
router.get("/fluxo-caixa", fluxoCaixa);
router.get("/dre", dreSimplificado);
router.get("/export/excel", exportarExcel);
router.get("/export/pdf", exportarPdf);
router.get("/resumo", resumoFinanceiro);

router.get("/categorias", listarCategorias);
router.post("/categorias", criarCategoria);
router.put("/categorias/:id", atualizarCategoria);

router.get("/centros-custo", listarCentrosCusto);
router.post("/centros-custo", criarCentroCusto);
router.put("/centros-custo/:id", atualizarCentroCusto);

router.get("/lancamentos", listarLancamentos);
router.post("/lancamentos", criarLancamento);
router.get("/lancamentos/:id", buscarLancamento);
router.put("/lancamentos/:id", atualizarLancamento);
router.post("/lancamentos/:id/liquidar", liquidarLancamento);
router.delete("/lancamentos/:id", cancelarLancamento);

router.get("/cobrancas", listarCobrancas);
router.post("/cobrancas", criarCobranca);
router.patch("/cobrancas/:id/pagar", registrarPagamento);
router.post("/cobrancas/gerar-mensais", gerarCobrancasMensais);

router.get("/comissoes", listarComissoes);
router.post("/comissoes", criarComissao);
router.post("/comissoes/gerar-de-contrato/:contratoId", gerarComissaoDeContrato);
router.put("/comissoes/:id", atualizarComissao);
router.post("/comissoes/:id/aprovar", aprovarComissao);
router.post("/comissoes/:id/pagar", pagarComissao);

router.get("/caixa", listarCaixas);
router.post("/caixa", abrirCaixa);
router.get("/caixa/:id", buscarCaixa);
router.post("/caixa/:id/movimentos", adicionarMovimentoCaixa);
router.post("/caixa/:id/fechar", fecharCaixa);

router.get("/conciliacoes", listarConciliacoes);
router.post("/conciliacoes", criarConciliacao);
router.get("/conciliacoes/:id", buscarConciliacao);
router.post("/conciliacoes/:id/itens", adicionarItemConciliacao);
router.post("/conciliacoes/:id/finalizar", finalizarConciliacao);

// Aliases de compatibilidade
router.get("/", listarCobrancas);
router.post("/", criarCobranca);
router.patch("/:id/pagar", registrarPagamento);
router.post("/gerar-mensais", gerarCobrancasMensais);

export default router;
