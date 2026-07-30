import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box, Chip, Collapse, Grid, InputAdornment, LinearProgress, Pagination, Stack, Tab, Tabs, Typography,
} from "@mui/material";
import {
  AccountBalanceWalletOutlined, Add, AssessmentOutlined, Autorenew, CheckCircleOutlined,
  FilterAltOutlined, PaymentsOutlined, PictureAsPdfOutlined, Search, TableViewOutlined,
} from "@mui/icons-material";
import MainLayout from "../components/layout/MainLayout";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import Input from "../components/ui/Input";
import Loading from "../components/ui/Loading";
import Modal from "../components/ui/Modal";
import Select from "../components/ui/Select";
import { useToast } from "../components/ui/Toast";
import api from "../api/axios";
import { formatCurrency, formatDate } from "../utils/formatters";
import {
  FORMAS_PAGAMENTO, STATUS_COBRANCA_FIN, STATUS_COMISSAO, STATUS_LANCAMENTO, TIPOS_LANCAMENTO,
  downloadBlob, optionLabel, statusMeta,
} from "../utils/financeiro";

const TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "receber", label: "A receber" },
  { id: "pagar", label: "A pagar" },
  { id: "cobrancas", label: "Cobranças" },
  { id: "comissoes", label: "Comissões" },
  { id: "fluxo", label: "Fluxo de caixa" },
  { id: "caixa", label: "Caixa diário" },
  { id: "conciliacao", label: "Conciliação" },
  { id: "dre", label: "DRE" },
  { id: "catalogo", label: "Categorias" },
];

function Metric({ label, value, hint }) {
  return (
    <Card contentSx={{ p: 2 }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="h6" fontWeight={850}>{value}</Typography>
      {hint && <Typography variant="caption" color="text.secondary">{hint}</Typography>}
    </Card>
  );
}

function BarChart({ items, maxKey = "value" }) {
  const max = Math.max(...items.map((item) => Math.abs(item[maxKey] || 0)), 1);
  if (!items.length) return <Typography color="text.secondary">Sem dados no período.</Typography>;
  return (
    <Stack spacing={1.5} sx={{ mt: 1 }}>
      {items.map((item) => (
        <Box key={item.label}>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
            <Typography variant="body2" fontWeight={650}>{item.label}</Typography>
            <Typography variant="body2" color="text.secondary">{formatCurrency(item[maxKey])}</Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={Math.min(100, (Math.abs(item[maxKey]) / max) * 100)}
            sx={{ height: 8, borderRadius: 99 }}
            color={item[maxKey] < 0 ? "error" : "primary"}
          />
        </Box>
      ))}
    </Stack>
  );
}

const emptyLancamento = {
  tipo: "A_RECEBER", descricao: "", valor: "", vencimento: "", categoriaId: "", centroCustoId: "",
  clienteId: "", contratoId: "", corretorId: "", formaPagamento: "", observacoes: "",
};

export default function Financeiro() {
  const toast = useToast();
  const [tab, setTab] = useState("dashboard");
  const [options, setOptions] = useState({ categorias: [], centros: [], clientes: [], contratos: [], corretores: [] });
  const [dashboard, setDashboard] = useState(null);
  const [loadingDash, setLoadingDash] = useState(true);

  const [lancamentos, setLancamentos] = useState([]);
  const [metaLanc, setMetaLanc] = useState({ page: 1, totalPages: 1, total: 0 });
  const [pageLanc, setPageLanc] = useState(1);
  const [searchLanc, setSearchLanc] = useState("");
  const [debouncedLanc, setDebouncedLanc] = useState("");
  const [filtersLanc, setFiltersLanc] = useState({ status: "", categoriaId: "", centroCustoId: "" });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loadingList, setLoadingList] = useState(false);

  const [cobrancas, setCobrancas] = useState([]);
  const [metaCob, setMetaCob] = useState({ page: 1, totalPages: 1, total: 0 });
  const [pageCob, setPageCob] = useState(1);
  const [statusCob, setStatusCob] = useState("");
  const [searchCob, setSearchCob] = useState("");

  const [comissoes, setComissoes] = useState([]);
  const [metaCom, setMetaCom] = useState({ page: 1, totalPages: 1, total: 0 });
  const [pageCom, setPageCom] = useState(1);
  const [statusCom, setStatusCom] = useState("");

  const [fluxo, setFluxo] = useState(null);
  const [dre, setDre] = useState(null);
  const [caixas, setCaixas] = useState([]);
  const [caixaDetalhe, setCaixaDetalhe] = useState(null);
  const [conciliacoes, setConciliacoes] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [centros, setCentros] = useState([]);

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyLancamento);
  const [saving, setSaving] = useState(false);
  const [payTarget, setPayTarget] = useState(null);
  const [formaPagamento, setFormaPagamento] = useState("PIX");
  const [busy, setBusy] = useState(false);

  const [cobFormOpen, setCobFormOpen] = useState(false);
  const [cobForm, setCobForm] = useState({ contratoId: "", descricao: "", valor: "", vencimento: "" });
  const [comFormOpen, setComFormOpen] = useState(false);
  const [comForm, setComForm] = useState({ corretorId: "", contratoId: "", descricao: "", valorBase: "", percentual: "5", valor: "" });
  const [catForm, setCatForm] = useState({ nome: "", tipo: "RECEITA", codigo: "" });
  const [centroForm, setCentroForm] = useState({ nome: "", codigo: "" });
  const [movForm, setMovForm] = useState({ tipo: "ENTRADA", descricao: "", valor: "", formaPagamento: "PIX" });
  const [concFormOpen, setConcFormOpen] = useState(false);
  const [concForm, setConcForm] = useState({ titulo: "", periodoInicio: "", periodoFim: "", saldoExtrato: "" });

  useEffect(() => {
    api.get("/financeiro/opcoes").then((res) => setOptions(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedLanc(searchLanc); setPageLanc(1); }, 350);
    return () => clearTimeout(t);
  }, [searchLanc]);

  const loadDashboard = useCallback(async () => {
    setLoadingDash(true);
    try {
      const response = await api.get("/financeiro/dashboard");
      setDashboard(response.data);
    } catch (error) {
      toast.error(error.response?.data?.erro || "Erro ao carregar dashboard.");
    } finally {
      setLoadingDash(false);
    }
  }, [toast]);

  const loadLancamentos = useCallback(async (tipo) => {
    setLoadingList(true);
    try {
      const params = {
        tipo, page: pageLanc, limit: 12, busca: debouncedLanc, ...filtersLanc,
      };
      Object.keys(params).forEach((key) => { if (params[key] === "" || params[key] == null) delete params[key]; });
      const response = await api.get("/financeiro/lancamentos", { params });
      setLancamentos(response.data.data || []);
      setMetaLanc(response.data.meta || { page: 1, totalPages: 1, total: 0 });
    } catch (error) {
      toast.error(error.response?.data?.erro || "Erro ao listar lançamentos.");
    } finally {
      setLoadingList(false);
    }
  }, [debouncedLanc, filtersLanc, pageLanc, toast]);

  const loadCobrancas = useCallback(async () => {
    setLoadingList(true);
    try {
      const params = { page: pageCob, limit: 12, status: statusCob || undefined, busca: searchCob || undefined };
      const response = await api.get("/financeiro/cobrancas", { params });
      setCobrancas(response.data.data || []);
      setMetaCob(response.data.meta || { page: 1, totalPages: 1, total: 0 });
    } catch (error) {
      toast.error(error.response?.data?.erro || "Erro ao listar cobranças.");
    } finally {
      setLoadingList(false);
    }
  }, [pageCob, searchCob, statusCob, toast]);

  const loadComissoes = useCallback(async () => {
    setLoadingList(true);
    try {
      const response = await api.get("/financeiro/comissoes", {
        params: { page: pageCom, limit: 12, status: statusCom || undefined },
      });
      setComissoes(response.data.data || []);
      setMetaCom(response.data.meta || { page: 1, totalPages: 1, total: 0 });
    } catch (error) {
      toast.error(error.response?.data?.erro || "Erro ao listar comissões.");
    } finally {
      setLoadingList(false);
    }
  }, [pageCom, statusCom, toast]);

  const loadFluxo = useCallback(async () => {
    try {
      const response = await api.get("/financeiro/fluxo-caixa");
      setFluxo(response.data);
    } catch (error) {
      toast.error(error.response?.data?.erro || "Erro no fluxo de caixa.");
    }
  }, [toast]);

  const loadDre = useCallback(async () => {
    try {
      const response = await api.get("/financeiro/dre");
      setDre(response.data);
    } catch (error) {
      toast.error(error.response?.data?.erro || "Erro no DRE.");
    }
  }, [toast]);

  const loadCaixas = useCallback(async () => {
    try {
      const response = await api.get("/financeiro/caixa");
      setCaixas(response.data.data || []);
    } catch (error) {
      toast.error(error.response?.data?.erro || "Erro ao listar caixas.");
    }
  }, [toast]);

  const loadConciliacoes = useCallback(async () => {
    try {
      const response = await api.get("/financeiro/conciliacoes");
      setConciliacoes(response.data.data || []);
    } catch (error) {
      toast.error(error.response?.data?.erro || "Erro ao listar conciliações.");
    }
  }, [toast]);

  const loadCatalogo = useCallback(async () => {
    try {
      const [cats, cens] = await Promise.all([
        api.get("/financeiro/categorias"),
        api.get("/financeiro/centros-custo"),
      ]);
      setCategorias(cats.data.data || []);
      setCentros(cens.data.data || []);
    } catch (error) {
      toast.error(error.response?.data?.erro || "Erro ao carregar catálogo.");
    }
  }, [toast]);

  useEffect(() => {
    if (tab === "dashboard") loadDashboard();
    if (tab === "receber") loadLancamentos("A_RECEBER");
    if (tab === "pagar") loadLancamentos("A_PAGAR");
    if (tab === "cobrancas") loadCobrancas();
    if (tab === "comissoes") loadComissoes();
    if (tab === "fluxo") loadFluxo();
    if (tab === "dre") loadDre();
    if (tab === "caixa") loadCaixas();
    if (tab === "conciliacao") loadConciliacoes();
    if (tab === "catalogo") loadCatalogo();
  }, [tab, loadDashboard, loadLancamentos, loadCobrancas, loadComissoes, loadFluxo, loadDre, loadCaixas, loadConciliacoes, loadCatalogo]);

  const ind = dashboard?.indicadores || {};
  const chartFluxo = useMemo(() => (
    (dashboard?.fluxoMensal || []).map((item) => ({ label: item.label, value: item.saldo }))
  ), [dashboard]);

  const openCreateLancamento = (tipo) => {
    setForm({ ...emptyLancamento, tipo });
    setFormOpen(true);
  };

  const saveLancamento = async () => {
    if (!form.descricao.trim() || !form.valor || !form.vencimento) {
      toast.error("Preencha descrição, valor e vencimento.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/financeiro/lancamentos", {
        ...form,
        valor: Number(form.valor),
        categoriaId: form.categoriaId ? Number(form.categoriaId) : null,
        centroCustoId: form.centroCustoId ? Number(form.centroCustoId) : null,
        clienteId: form.clienteId ? Number(form.clienteId) : null,
        contratoId: form.contratoId ? Number(form.contratoId) : null,
        corretorId: form.corretorId ? Number(form.corretorId) : null,
        formaPagamento: form.formaPagamento || null,
        vencimento: new Date(form.vencimento).toISOString(),
      });
      toast.success("Lançamento criado.");
      setFormOpen(false);
      loadLancamentos(form.tipo);
      loadDashboard();
    } catch (error) {
      toast.error(error.response?.data?.erro || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const liquidar = async () => {
    if (!payTarget) return;
    setBusy(true);
    try {
      if (payTarget.kind === "lancamento") {
        await api.post(`/financeiro/lancamentos/${payTarget.id}/liquidar`, { formaPagamento });
      } else if (payTarget.kind === "cobranca") {
        await api.patch(`/financeiro/cobrancas/${payTarget.id}/pagar`, { formaPagamento });
      } else if (payTarget.kind === "comissao") {
        await api.post(`/financeiro/comissoes/${payTarget.id}/pagar`);
      }
      toast.success("Baixa registrada.");
      setPayTarget(null);
      if (tab === "receber") loadLancamentos("A_RECEBER");
      if (tab === "pagar") loadLancamentos("A_PAGAR");
      if (tab === "cobrancas") loadCobrancas();
      if (tab === "comissoes") loadComissoes();
      loadDashboard();
    } catch (error) {
      toast.error(error.response?.data?.erro || "Erro ao liquidar.");
    } finally {
      setBusy(false);
    }
  };

  const exportFile = async (type) => {
    try {
      const response = await api.get(`/financeiro/export/${type}`, {
        params: { tipo: tab === "pagar" ? "A_PAGAR" : tab === "receber" ? "A_RECEBER" : undefined },
        responseType: "blob",
      });
      downloadBlob(response.data, type === "pdf" ? "financeiro-sussai.pdf" : "financeiro-sussai.xlsx");
      toast.success("Exportação gerada.");
    } catch (error) {
      let message = "Erro na exportação.";
      if (error.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          message = JSON.parse(text).erro || message;
        } catch { /* ignore */ }
      }
      toast.error(message);
    }
  };

  const renderLancamentos = (tipo) => (
    <Stack spacing={2.5}>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={2}>
        <Input
          size="small"
          placeholder="Pesquisar lançamentos..."
          value={searchLanc}
          onChange={(e) => setSearchLanc(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
          sx={{ maxWidth: 360 }}
        />
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button variant="outlined" startIcon={<FilterAltOutlined />} onClick={() => setFiltersOpen((v) => !v)}>Filtros</Button>
          <Button variant="outlined" startIcon={<TableViewOutlined />} onClick={() => exportFile("excel")}>Excel</Button>
          <Button variant="outlined" startIcon={<PictureAsPdfOutlined />} onClick={() => exportFile("pdf")}>PDF</Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => openCreateLancamento(tipo)}>Novo</Button>
        </Stack>
      </Stack>

      <Collapse in={filtersOpen}>
        <Card>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Select size="small" label="Status" value={filtersLanc.status} options={[{ value: "", label: "Todos" }, ...STATUS_LANCAMENTO]} onChange={(e) => { setFiltersLanc((c) => ({ ...c, status: e.target.value })); setPageLanc(1); }} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Select size="small" label="Categoria" value={filtersLanc.categoriaId} options={[{ value: "", label: "Todas" }, ...(options.categorias || []).map((c) => ({ value: String(c.id), label: c.nome }))]} onChange={(e) => { setFiltersLanc((c) => ({ ...c, categoriaId: e.target.value })); setPageLanc(1); }} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Select size="small" label="Centro de custo" value={filtersLanc.centroCustoId} options={[{ value: "", label: "Todos" }, ...(options.centros || []).map((c) => ({ value: String(c.id), label: c.nome }))]} onChange={(e) => { setFiltersLanc((c) => ({ ...c, centroCustoId: e.target.value })); setPageLanc(1); }} />
            </Grid>
          </Grid>
        </Card>
      </Collapse>

      {loadingList ? <Loading variant="skeleton" rows={5} /> : lancamentos.length === 0 ? (
        <EmptyState title="Nenhum lançamento" description="Crie o primeiro lançamento deste tipo." actionLabel="Novo lançamento" onAction={() => openCreateLancamento(tipo)} />
      ) : (
        <Stack spacing={1.5}>
          {lancamentos.map((item) => {
            const st = statusMeta(STATUS_LANCAMENTO, item.status);
            return (
              <Card key={item.id} contentSx={{ p: 2 }}>
                <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={1.5}>
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                      <Chip size="small" label={st.label} color={st.color} />
                      <Typography variant="caption" color="text.secondary">{optionLabel(TIPOS_LANCAMENTO, item.tipo)}</Typography>
                    </Stack>
                    <Typography fontWeight={800}>{item.descricao}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.cliente?.nome || "—"} · {item.contrato?.numero || "sem contrato"} · venc. {formatDate(item.vencimento)}
                    </Typography>
                  </Box>
                  <Stack alignItems={{ xs: "flex-start", md: "flex-end" }} spacing={1}>
                    <Typography variant="h6" fontWeight={850}>{formatCurrency(item.valor)}</Typography>
                    {["ABERTO", "PARCIAL", "ATRASADO"].includes(item.status) && (
                      <Button size="small" variant="contained" onClick={() => setPayTarget({ kind: "lancamento", id: item.id, label: item.descricao })}>Liquidar</Button>
                    )}
                  </Stack>
                </Stack>
              </Card>
            );
          })}
          {metaLanc.totalPages > 1 && (
            <Pagination page={pageLanc} count={metaLanc.totalPages} onChange={(_, value) => setPageLanc(value)} color="primary" />
          )}
        </Stack>
      )}
    </Stack>
  );

  return (
    <MainLayout title="Financeiro">
      <Stack spacing={3}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={2}>
          <Box>
            <Typography variant="h5" fontWeight={850}>Gestão financeira</Typography>
            <Typography color="text.secondary">Receber, pagar, comissões, caixa e DRE — pronto para escala multiempresa.</Typography>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button variant="outlined" startIcon={<Autorenew />} onClick={async () => {
              try {
                const res = await api.post("/financeiro/cobrancas/gerar-mensais");
                toast.success(res.data.mensagem || "Cobranças geradas.");
                loadCobrancas();
                loadDashboard();
              } catch (error) {
                toast.error(error.response?.data?.erro || "Erro ao gerar cobranças.");
              }
            }}>Gerar cobranças do mês</Button>
          </Stack>
        </Stack>

        <Tabs
          value={tab}
          onChange={(_, value) => setTab(value)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          {TABS.map((item) => <Tab key={item.id} value={item.id} label={item.label} />)}
        </Tabs>

        {tab === "dashboard" && (
          loadingDash ? <Loading variant="skeleton" rows={6} /> : (
            <Stack spacing={2.5}>
              <Grid container spacing={2}>
                {[
                  { label: "A receber", value: formatCurrency(ind.aReceber), hint: `${ind.aReceberQtd || 0} títulos` },
                  { label: "A pagar", value: formatCurrency(ind.aPagar), hint: `${ind.aPagarQtd || 0} títulos` },
                  { label: "Recebido no mês", value: formatCurrency(ind.recebidoMes) },
                  { label: "Pago no mês", value: formatCurrency(ind.pagoMes) },
                  { label: "Cobranças atrasadas", value: formatCurrency(ind.cobrancasAtrasadas), hint: `${ind.cobrancasAtrasadasQtd || 0} itens` },
                  { label: "Comissões pendentes", value: formatCurrency(ind.comissoesPendentes), hint: `${ind.comissoesPendentesQtd || 0} itens` },
                  { label: "Resultado do mês", value: formatCurrency(ind.resultadoMes) },
                  { label: "Comissões pagas no mês", value: formatCurrency(ind.comissoesPagasMes) },
                ].map((card) => (
                  <Grid key={card.label} size={{ xs: 12, sm: 6, md: 3 }}><Metric {...card} /></Grid>
                ))}
              </Grid>
              <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, md: 7 }}>
                  <Card>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <AssessmentOutlined color="primary" />
                      <Typography variant="h6" fontWeight={800}>Fluxo mensal (6 meses)</Typography>
                    </Stack>
                    <BarChart items={chartFluxo} />
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 5 }}>
                  <Card>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                      <AccountBalanceWalletOutlined color="primary" />
                      <Typography variant="h6" fontWeight={800}>Atalhos</Typography>
                    </Stack>
                    <Stack spacing={1}>
                      <Button variant="outlined" onClick={() => setTab("receber")}>Contas a receber</Button>
                      <Button variant="outlined" onClick={() => setTab("pagar")}>Contas a pagar</Button>
                      <Button variant="outlined" onClick={() => setTab("comissoes")}>Comissões</Button>
                      <Button variant="outlined" onClick={() => setTab("caixa")}>Caixa diário</Button>
                    </Stack>
                  </Card>
                </Grid>
              </Grid>
            </Stack>
          )
        )}

        {tab === "receber" && renderLancamentos("A_RECEBER")}
        {tab === "pagar" && renderLancamentos("A_PAGAR")}

        {tab === "cobrancas" && (
          <Stack spacing={2.5}>
            <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={2}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ flex: 1 }}>
                <Input size="small" placeholder="Buscar cobrança..." value={searchCob} onChange={(e) => { setSearchCob(e.target.value); setPageCob(1); }} />
                <Select size="small" label="Status" value={statusCob} options={[{ value: "", label: "Todos" }, ...STATUS_COBRANCA_FIN]} onChange={(e) => { setStatusCob(e.target.value); setPageCob(1); }} sx={{ minWidth: 160 }} />
              </Stack>
              <Button variant="contained" startIcon={<Add />} onClick={() => setCobFormOpen(true)}>Nova cobrança</Button>
            </Stack>
            {loadingList ? <Loading variant="skeleton" rows={5} /> : cobrancas.length === 0 ? (
              <EmptyState title="Sem cobranças" description="Gere cobranças mensais ou crie manualmente." />
            ) : (
              <Stack spacing={1.5}>
                {cobrancas.map((item) => {
                  const st = statusMeta(STATUS_COBRANCA_FIN, item.status);
                  return (
                    <Card key={item.id} contentSx={{ p: 2 }}>
                      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={1}>
                        <Box>
                          <Chip size="small" label={st.label} color={st.color} sx={{ mb: 0.75 }} />
                          <Typography fontWeight={800}>{item.descricao}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Contrato {item.contrato?.numero || "—"} · {item.contrato?.cliente?.nome || "—"} · venc. {formatDate(item.vencimento)}
                          </Typography>
                        </Box>
                        <Stack alignItems={{ md: "flex-end" }} spacing={1}>
                          <Typography variant="h6" fontWeight={850}>{formatCurrency(item.valor)}</Typography>
                          {["PENDENTE", "ATRASADO"].includes(item.status) && (
                            <Button size="small" variant="contained" startIcon={<PaymentsOutlined />} onClick={() => setPayTarget({ kind: "cobranca", id: item.id, label: item.descricao })}>Receber</Button>
                          )}
                        </Stack>
                      </Stack>
                    </Card>
                  );
                })}
                {metaCob.totalPages > 1 && <Pagination page={pageCob} count={metaCob.totalPages} onChange={(_, v) => setPageCob(v)} color="primary" />}
              </Stack>
            )}
          </Stack>
        )}

        {tab === "comissoes" && (
          <Stack spacing={2.5}>
            <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={2}>
              <Select size="small" label="Status" value={statusCom} options={[{ value: "", label: "Todos" }, ...STATUS_COMISSAO]} onChange={(e) => { setStatusCom(e.target.value); setPageCom(1); }} sx={{ maxWidth: 220 }} />
              <Button variant="contained" startIcon={<Add />} onClick={() => setComFormOpen(true)}>Nova comissão</Button>
            </Stack>
            {loadingList ? <Loading variant="skeleton" rows={5} /> : comissoes.length === 0 ? (
              <EmptyState title="Sem comissões" description="Gere a partir de um contrato ou cadastre manualmente." />
            ) : (
              <Stack spacing={1.5}>
                {comissoes.map((item) => {
                  const st = statusMeta(STATUS_COMISSAO, item.status);
                  return (
                    <Card key={item.id} contentSx={{ p: 2 }}>
                      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={1}>
                        <Box>
                          <Chip size="small" label={st.label} color={st.color} sx={{ mb: 0.75 }} />
                          <Typography fontWeight={800}>{item.descricao}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {item.corretor?.nome} · {item.percentual}% sobre {formatCurrency(item.valorBase)} · {item.contrato?.numero || "—"}
                          </Typography>
                        </Box>
                        <Stack alignItems={{ md: "flex-end" }} spacing={1}>
                          <Typography variant="h6" fontWeight={850}>{formatCurrency(item.valor)}</Typography>
                          <Stack direction="row" spacing={1}>
                            {item.status === "PREVISTA" && (
                              <Button size="small" variant="outlined" onClick={async () => {
                                try {
                                  await api.post(`/financeiro/comissoes/${item.id}/aprovar`);
                                  toast.success("Comissão aprovada.");
                                  loadComissoes();
                                } catch (error) {
                                  toast.error(error.response?.data?.erro || "Erro ao aprovar.");
                                }
                              }}>Aprovar</Button>
                            )}
                            {["PREVISTA", "APROVADA"].includes(item.status) && (
                              <Button size="small" variant="contained" onClick={() => setPayTarget({ kind: "comissao", id: item.id, label: item.descricao })}>Pagar</Button>
                            )}
                          </Stack>
                        </Stack>
                      </Stack>
                    </Card>
                  );
                })}
                {metaCom.totalPages > 1 && <Pagination page={pageCom} count={metaCom.totalPages} onChange={(_, v) => setPageCom(v)} color="primary" />}
              </Stack>
            )}
          </Stack>
        )}

        {tab === "fluxo" && (
          <Stack spacing={2}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}><Metric label="Entradas" value={formatCurrency(fluxo?.totais?.entradas)} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><Metric label="Saídas" value={formatCurrency(fluxo?.totais?.saidas)} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><Metric label="Saldo" value={formatCurrency(fluxo?.totais?.saldo)} /></Grid>
            </Grid>
            <Card>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>Série diária</Typography>
              <BarChart items={(fluxo?.serie || []).slice(-14).map((item) => ({ label: formatDate(item.data), value: item.saldo }))} />
            </Card>
          </Stack>
        )}

        {tab === "dre" && (
          <Stack spacing={2}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}><Metric label="Receitas" value={formatCurrency(dre?.receitas)} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><Metric label="Despesas" value={formatCurrency(dre?.despesas)} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><Metric label="Resultado" value={formatCurrency(dre?.resultado)} /></Grid>
            </Grid>
            <Card>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>Por categoria</Typography>
              <BarChart items={(dre?.categorias || []).map((item) => ({ label: item.nome, value: item.tipo === "DESPESA" ? -item.valor : item.valor }))} />
            </Card>
          </Stack>
        )}

        {tab === "caixa" && (
          <Stack spacing={2.5}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="h6" fontWeight={800}>Caixas</Typography>
              <Button variant="contained" startIcon={<Add />} onClick={async () => {
                try {
                  await api.post("/financeiro/caixa", { saldoInicial: 0 });
                  toast.success("Caixa do dia aberto.");
                  loadCaixas();
                } catch (error) {
                  toast.error(error.response?.data?.erro || "Erro ao abrir caixa.");
                }
              }}>Abrir caixa de hoje</Button>
            </Stack>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 5 }}>
                <Stack spacing={1}>
                  {caixas.map((caixa) => (
                    <Card key={caixa.id} contentSx={{ p: 2, cursor: "pointer" }} onClick={async () => {
                      const res = await api.get(`/financeiro/caixa/${caixa.id}`);
                      setCaixaDetalhe(res.data);
                    }}>
                      <Stack direction="row" justifyContent="space-between">
                        <Box>
                          <Typography fontWeight={800}>{formatDate(caixa.data)}</Typography>
                          <Typography variant="caption" color="text.secondary">{caixa.status} · {caixa._count?.movimentos || 0} movimentos</Typography>
                        </Box>
                        <Chip size="small" label={caixa.status} color={caixa.status === "ABERTO" ? "success" : "default"} />
                      </Stack>
                    </Card>
                  ))}
                  {caixas.length === 0 && <EmptyState title="Nenhum caixa" description="Abra o caixa do dia para registrar entradas e saídas." />}
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, md: 7 }}>
                {caixaDetalhe ? (
                  <Card>
                    <Typography variant="h6" fontWeight={800}>Caixa {formatDate(caixaDetalhe.data)}</Typography>
                    <Typography color="text.secondary" sx={{ mb: 2 }}>
                      Saldo atual {formatCurrency(caixaDetalhe.totais?.saldoAtual)} · entradas {formatCurrency(caixaDetalhe.totais?.entradas)} · saídas {formatCurrency(caixaDetalhe.totais?.saidas)}
                    </Typography>
                    {caixaDetalhe.status === "ABERTO" && (
                      <Grid container spacing={1.5} sx={{ mb: 2 }}>
                        <Grid size={{ xs: 12, sm: 3 }}><Select size="small" label="Tipo" value={movForm.tipo} options={[{ value: "ENTRADA", label: "Entrada" }, { value: "SAIDA", label: "Saída" }]} onChange={(e) => setMovForm((c) => ({ ...c, tipo: e.target.value }))} /></Grid>
                        <Grid size={{ xs: 12, sm: 5 }}><Input size="small" label="Descrição" value={movForm.descricao} onChange={(e) => setMovForm((c) => ({ ...c, descricao: e.target.value }))} /></Grid>
                        <Grid size={{ xs: 12, sm: 2 }}><Input size="small" type="number" label="Valor" value={movForm.valor} onChange={(e) => setMovForm((c) => ({ ...c, valor: e.target.value }))} /></Grid>
                        <Grid size={{ xs: 12, sm: 2 }}>
                          <Button fullWidth variant="contained" onClick={async () => {
                            try {
                              await api.post(`/financeiro/caixa/${caixaDetalhe.id}/movimentos`, { ...movForm, valor: Number(movForm.valor) });
                              toast.success("Movimento lançado.");
                              const res = await api.get(`/financeiro/caixa/${caixaDetalhe.id}`);
                              setCaixaDetalhe(res.data);
                              setMovForm({ tipo: "ENTRADA", descricao: "", valor: "", formaPagamento: "PIX" });
                            } catch (error) {
                              toast.error(error.response?.data?.erro || "Erro ao lançar.");
                            }
                          }}>OK</Button>
                        </Grid>
                      </Grid>
                    )}
                    <Stack spacing={1}>
                      {(caixaDetalhe.movimentos || []).map((mov) => (
                        <Box key={mov.id} sx={{ display: "flex", justifyContent: "space-between" }}>
                          <Typography variant="body2">{mov.tipo} · {mov.descricao}</Typography>
                          <Typography fontWeight={750}>{formatCurrency(mov.valor)}</Typography>
                        </Box>
                      ))}
                    </Stack>
                    {caixaDetalhe.status === "ABERTO" && (
                      <Button sx={{ mt: 2 }} variant="outlined" startIcon={<CheckCircleOutlined />} onClick={async () => {
                        try {
                          await api.post(`/financeiro/caixa/${caixaDetalhe.id}/fechar`);
                          toast.success("Caixa fechado.");
                          loadCaixas();
                          setCaixaDetalhe(null);
                        } catch (error) {
                          toast.error(error.response?.data?.erro || "Erro ao fechar.");
                        }
                      }}>Fechar caixa</Button>
                    )}
                  </Card>
                ) : (
                  <EmptyState title="Selecione um caixa" description="Clique em um dia à esquerda para ver movimentos." />
                )}
              </Grid>
            </Grid>
          </Stack>
        )}

        {tab === "conciliacao" && (
          <Stack spacing={2.5}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="h6" fontWeight={800}>Conciliações</Typography>
              <Button variant="contained" startIcon={<Add />} onClick={() => setConcFormOpen(true)}>Nova conciliação</Button>
            </Stack>
            {conciliacoes.length === 0 ? (
              <EmptyState title="Nenhuma conciliação" description="Crie um período para conciliar lançamentos liquidados." />
            ) : (
              <Stack spacing={1.5}>
                {conciliacoes.map((item) => (
                  <Card key={item.id} contentSx={{ p: 2 }}>
                    <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={1}>
                      <Box>
                        <Chip size="small" label={item.status} sx={{ mb: 0.75 }} />
                        <Typography fontWeight={800}>{item.titulo}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(item.periodoInicio)} → {formatDate(item.periodoFim)} · {item._count?.itens || 0} itens · sistema {formatCurrency(item.saldoSistema)}
                        </Typography>
                      </Box>
                      {item.status === "ABERTA" && (
                        <Button variant="contained" onClick={async () => {
                          try {
                            await api.post(`/financeiro/conciliacoes/${item.id}/finalizar`);
                            toast.success("Conciliação finalizada.");
                            loadConciliacoes();
                          } catch (error) {
                            toast.error(error.response?.data?.erro || "Erro ao finalizar.");
                          }
                        }}>Finalizar</Button>
                      )}
                    </Stack>
                  </Card>
                ))}
              </Stack>
            )}
          </Stack>
        )}

        {tab === "catalogo" && (
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>Categorias</Typography>
                <Grid container spacing={1} sx={{ mb: 2 }}>
                  <Grid size={5}><Input size="small" label="Nome" value={catForm.nome} onChange={(e) => setCatForm((c) => ({ ...c, nome: e.target.value }))} /></Grid>
                  <Grid size={3}><Select size="small" label="Tipo" value={catForm.tipo} options={[{ value: "RECEITA", label: "Receita" }, { value: "DESPESA", label: "Despesa" }]} onChange={(e) => setCatForm((c) => ({ ...c, tipo: e.target.value }))} /></Grid>
                  <Grid size={2}><Input size="small" label="Código" value={catForm.codigo} onChange={(e) => setCatForm((c) => ({ ...c, codigo: e.target.value }))} /></Grid>
                  <Grid size={2}><Button fullWidth variant="contained" onClick={async () => {
                    try {
                      await api.post("/financeiro/categorias", catForm);
                      toast.success("Categoria criada.");
                      setCatForm({ nome: "", tipo: "RECEITA", codigo: "" });
                      loadCatalogo();
                    } catch (error) {
                      toast.error(error.response?.data?.erro || "Erro.");
                    }
                  }}>Add</Button></Grid>
                </Grid>
                <Stack spacing={1}>
                  {categorias.map((item) => (
                    <Box key={item.id} sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2">{item.nome}</Typography>
                      <Chip size="small" label={item.tipo} />
                    </Box>
                  ))}
                </Stack>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>Centros de custo</Typography>
                <Grid container spacing={1} sx={{ mb: 2 }}>
                  <Grid size={5}><Input size="small" label="Nome" value={centroForm.nome} onChange={(e) => setCentroForm((c) => ({ ...c, nome: e.target.value }))} /></Grid>
                  <Grid size={4}><Input size="small" label="Código" value={centroForm.codigo} onChange={(e) => setCentroForm((c) => ({ ...c, codigo: e.target.value }))} /></Grid>
                  <Grid size={3}><Button fullWidth variant="contained" onClick={async () => {
                    try {
                      await api.post("/financeiro/centros-custo", centroForm);
                      toast.success("Centro criado.");
                      setCentroForm({ nome: "", codigo: "" });
                      loadCatalogo();
                    } catch (error) {
                      toast.error(error.response?.data?.erro || "Erro.");
                    }
                  }}>Add</Button></Grid>
                </Grid>
                <Stack spacing={1}>
                  {centros.map((item) => (
                    <Box key={item.id} sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2">{item.nome}</Typography>
                      <Typography variant="caption" color="text.secondary">{item.codigo || "—"}</Typography>
                    </Box>
                  ))}
                </Stack>
              </Card>
            </Grid>
          </Grid>
        )}
      </Stack>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Novo lançamento" actions={(
        <>
          <Button color="inherit" onClick={() => setFormOpen(false)}>Cancelar</Button>
          <Button variant="contained" loading={saving} onClick={saveLancamento}>Salvar</Button>
        </>
      )}>
        <Grid container spacing={2} sx={{ pt: 1 }}>
          <Grid size={{ xs: 12, sm: 4 }}><Select label="Tipo" value={form.tipo} options={TIPOS_LANCAMENTO} onChange={(e) => setForm((c) => ({ ...c, tipo: e.target.value }))} /></Grid>
          <Grid size={{ xs: 12, sm: 8 }}><Input label="Descrição" value={form.descricao} onChange={(e) => setForm((c) => ({ ...c, descricao: e.target.value }))} /></Grid>
          <Grid size={{ xs: 12, sm: 4 }}><Input type="number" label="Valor" value={form.valor} onChange={(e) => setForm((c) => ({ ...c, valor: e.target.value }))} /></Grid>
          <Grid size={{ xs: 12, sm: 4 }}><Input type="date" label="Vencimento" InputLabelProps={{ shrink: true }} value={form.vencimento} onChange={(e) => setForm((c) => ({ ...c, vencimento: e.target.value }))} /></Grid>
          <Grid size={{ xs: 12, sm: 4 }}><Select label="Forma" value={form.formaPagamento} options={[{ value: "", label: "—" }, ...FORMAS_PAGAMENTO]} onChange={(e) => setForm((c) => ({ ...c, formaPagamento: e.target.value }))} /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><Select label="Categoria" value={form.categoriaId} options={[{ value: "", label: "—" }, ...(options.categorias || []).map((c) => ({ value: String(c.id), label: c.nome }))]} onChange={(e) => setForm((c) => ({ ...c, categoriaId: e.target.value }))} /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><Select label="Centro de custo" value={form.centroCustoId} options={[{ value: "", label: "—" }, ...(options.centros || []).map((c) => ({ value: String(c.id), label: c.nome }))]} onChange={(e) => setForm((c) => ({ ...c, centroCustoId: e.target.value }))} /></Grid>
          <Grid size={{ xs: 12, sm: 4 }}><Select label="Cliente" value={form.clienteId} options={[{ value: "", label: "—" }, ...(options.clientes || []).map((c) => ({ value: String(c.id), label: c.nome }))]} onChange={(e) => setForm((c) => ({ ...c, clienteId: e.target.value }))} /></Grid>
          <Grid size={{ xs: 12, sm: 4 }}><Select label="Contrato" value={form.contratoId} options={[{ value: "", label: "—" }, ...(options.contratos || []).map((c) => ({ value: String(c.id), label: c.numero }))]} onChange={(e) => setForm((c) => ({ ...c, contratoId: e.target.value }))} /></Grid>
          <Grid size={{ xs: 12, sm: 4 }}><Select label="Corretor" value={form.corretorId} options={[{ value: "", label: "—" }, ...(options.corretores || []).map((c) => ({ value: String(c.id), label: c.nome }))]} onChange={(e) => setForm((c) => ({ ...c, corretorId: e.target.value }))} /></Grid>
        </Grid>
      </Modal>

      <Modal open={cobFormOpen} onClose={() => setCobFormOpen(false)} title="Nova cobrança" actions={(
        <>
          <Button color="inherit" onClick={() => setCobFormOpen(false)}>Cancelar</Button>
          <Button variant="contained" loading={saving} onClick={async () => {
            setSaving(true);
            try {
              await api.post("/financeiro/cobrancas", {
                ...cobForm,
                contratoId: Number(cobForm.contratoId),
                valor: Number(cobForm.valor),
                vencimento: new Date(cobForm.vencimento).toISOString(),
              });
              toast.success("Cobrança criada.");
              setCobFormOpen(false);
              loadCobrancas();
            } catch (error) {
              toast.error(error.response?.data?.erro || "Erro ao criar cobrança.");
            } finally {
              setSaving(false);
            }
          }}>Salvar</Button>
        </>
      )}>
        <Grid container spacing={2} sx={{ pt: 1 }}>
          <Grid size={12}><Select label="Contrato" value={cobForm.contratoId} options={(options.contratos || []).map((c) => ({ value: String(c.id), label: `${c.numero} · ${formatCurrency(c.valor)}` }))} onChange={(e) => {
            const contrato = (options.contratos || []).find((c) => String(c.id) === e.target.value);
            setCobForm((c) => ({
              ...c,
              contratoId: e.target.value,
              valor: contrato ? String(contrato.valor) : c.valor,
              descricao: contrato ? `Cobrança ${contrato.numero}` : c.descricao,
            }));
          }} /></Grid>
          <Grid size={12}><Input label="Descrição" value={cobForm.descricao} onChange={(e) => setCobForm((c) => ({ ...c, descricao: e.target.value }))} /></Grid>
          <Grid size={6}><Input type="number" label="Valor" value={cobForm.valor} onChange={(e) => setCobForm((c) => ({ ...c, valor: e.target.value }))} /></Grid>
          <Grid size={6}><Input type="date" label="Vencimento" InputLabelProps={{ shrink: true }} value={cobForm.vencimento} onChange={(e) => setCobForm((c) => ({ ...c, vencimento: e.target.value }))} /></Grid>
        </Grid>
      </Modal>

      <Modal open={comFormOpen} onClose={() => setComFormOpen(false)} title="Nova comissão" actions={(
        <>
          <Button color="inherit" onClick={() => setComFormOpen(false)}>Cancelar</Button>
          <Button variant="contained" loading={saving} onClick={async () => {
            setSaving(true);
            try {
              const valorBase = Number(comForm.valorBase);
              const percentual = Number(comForm.percentual);
              const valor = comForm.valor ? Number(comForm.valor) : (valorBase * percentual) / 100;
              await api.post("/financeiro/comissoes", {
                corretorId: Number(comForm.corretorId),
                contratoId: comForm.contratoId ? Number(comForm.contratoId) : null,
                descricao: comForm.descricao,
                valorBase,
                percentual,
                valor,
                competencia: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
              });
              toast.success("Comissão criada.");
              setComFormOpen(false);
              loadComissoes();
            } catch (error) {
              toast.error(error.response?.data?.erro || "Erro ao criar comissão.");
            } finally {
              setSaving(false);
            }
          }}>Salvar</Button>
        </>
      )}>
        <Grid container spacing={2} sx={{ pt: 1 }}>
          <Grid size={12}><Select label="Corretor" value={comForm.corretorId} options={(options.corretores || []).map((c) => ({ value: String(c.id), label: c.nome }))} onChange={(e) => setComForm((c) => ({ ...c, corretorId: e.target.value }))} /></Grid>
          <Grid size={12}><Select label="Contrato (opcional)" value={comForm.contratoId} options={[{ value: "", label: "—" }, ...(options.contratos || []).map((c) => ({ value: String(c.id), label: c.numero }))]} onChange={(e) => {
            const contrato = (options.contratos || []).find((c) => String(c.id) === e.target.value);
            setComForm((c) => ({
              ...c,
              contratoId: e.target.value,
              valorBase: contrato ? String(contrato.valor) : c.valorBase,
              descricao: contrato ? `Comissão ${contrato.numero}` : c.descricao,
            }));
          }} /></Grid>
          <Grid size={12}><Input label="Descrição" value={comForm.descricao} onChange={(e) => setComForm((c) => ({ ...c, descricao: e.target.value }))} /></Grid>
          <Grid size={4}><Input type="number" label="Base" value={comForm.valorBase} onChange={(e) => setComForm((c) => ({ ...c, valorBase: e.target.value }))} /></Grid>
          <Grid size={4}><Input type="number" label="%" value={comForm.percentual} onChange={(e) => setComForm((c) => ({ ...c, percentual: e.target.value }))} /></Grid>
          <Grid size={4}><Input type="number" label="Valor" value={comForm.valor} onChange={(e) => setComForm((c) => ({ ...c, valor: e.target.value }))} /></Grid>
          {comForm.contratoId && (
            <Grid size={12}>
              <Button variant="outlined" onClick={async () => {
                try {
                  await api.post(`/financeiro/comissoes/gerar-de-contrato/${comForm.contratoId}`);
                  toast.success("Comissão gerada do contrato.");
                  setComFormOpen(false);
                  loadComissoes();
                } catch (error) {
                  toast.error(error.response?.data?.erro || "Erro ao gerar.");
                }
              }}>Gerar automaticamente do contrato</Button>
            </Grid>
          )}
        </Grid>
      </Modal>

      <Modal open={concFormOpen} onClose={() => setConcFormOpen(false)} title="Nova conciliação" actions={(
        <>
          <Button color="inherit" onClick={() => setConcFormOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={async () => {
            try {
              await api.post("/financeiro/conciliacoes", {
                ...concForm,
                saldoExtrato: concForm.saldoExtrato ? Number(concForm.saldoExtrato) : null,
                periodoInicio: new Date(concForm.periodoInicio).toISOString(),
                periodoFim: new Date(concForm.periodoFim).toISOString(),
              });
              toast.success("Conciliação criada.");
              setConcFormOpen(false);
              loadConciliacoes();
            } catch (error) {
              toast.error(error.response?.data?.erro || "Erro ao criar.");
            }
          }}>Criar</Button>
        </>
      )}>
        <Grid container spacing={2} sx={{ pt: 1 }}>
          <Grid size={12}><Input label="Título" value={concForm.titulo} onChange={(e) => setConcForm((c) => ({ ...c, titulo: e.target.value }))} /></Grid>
          <Grid size={6}><Input type="date" label="Início" InputLabelProps={{ shrink: true }} value={concForm.periodoInicio} onChange={(e) => setConcForm((c) => ({ ...c, periodoInicio: e.target.value }))} /></Grid>
          <Grid size={6}><Input type="date" label="Fim" InputLabelProps={{ shrink: true }} value={concForm.periodoFim} onChange={(e) => setConcForm((c) => ({ ...c, periodoFim: e.target.value }))} /></Grid>
          <Grid size={12}><Input type="number" label="Saldo do extrato (opcional)" value={concForm.saldoExtrato} onChange={(e) => setConcForm((c) => ({ ...c, saldoExtrato: e.target.value }))} /></Grid>
        </Grid>
      </Modal>

      <Modal
        open={Boolean(payTarget)}
        onClose={() => setPayTarget(null)}
        title="Confirmar baixa"
        maxWidth="xs"
        actions={(
          <>
            <Button color="inherit" onClick={() => setPayTarget(null)}>Cancelar</Button>
            <Button variant="contained" loading={busy} onClick={liquidar}>Confirmar</Button>
          </>
        )}
      >
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          {payTarget ? `Confirmar liquidação de “${payTarget.label}”?` : ""}
        </Typography>
        {payTarget?.kind !== "comissao" && (
          <Select label="Forma de pagamento" value={formaPagamento} options={FORMAS_PAGAMENTO} onChange={(e) => setFormaPagamento(e.target.value)} />
        )}
      </Modal>
    </MainLayout>
  );
}
