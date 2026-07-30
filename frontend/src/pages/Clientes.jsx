import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Avatar,
  Box,
  Chip,
  Collapse,
  Grid,
  IconButton,
  InputAdornment,
  Pagination,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Add,
  DeleteOutlined,
  EditOutlined,
  FileDownloadOutlined,
  FilterAltOutlined,
  RestartAltOutlined,
  Search,
  VisibilityOutlined,
} from "@mui/icons-material";
import MainLayout from "../components/layout/MainLayout";
import AuthenticatedImage from "../components/imoveis/AuthenticatedImage";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import EmptyState from "../components/ui/EmptyState";
import Input from "../components/ui/Input";
import Loading from "../components/ui/Loading";
import Select from "../components/ui/Select";
import { useToast } from "../components/ui/Toast";
import api from "../api/axios";
import { formatCurrency } from "../utils/formatters";
import {
  INTERESSES_CLIENTE,
  ORDENACOES_CLIENTE,
  STATUS_CLIENTE,
  TIPOS_CLIENTE,
  TIPOS_PESSOA,
  optionLabel,
  statusMeta,
} from "../utils/clientes";

const initialFilters = {
  tipo: "",
  tipoPessoa: "",
  status: "",
  cidade: "",
  origem: "",
  tag: "",
  interesse: "",
  corretorId: "",
  faixaPrecoMin: "",
  faixaPrecoMax: "",
  ordenacao: "nome",
  ativo: "true",
};

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function Clientes() {
  const navigate = useNavigate();
  const toast = useToast();
  const [clients, setClients] = useState([]);
  const [options, setOptions] = useState({ corretores: [] });
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filters, setFilters] = useState(initialFilters);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [restoreTarget, setRestoreTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    api.get("/clientes/opcoes")
      .then((response) => setOptions(response.data))
      .catch(() => setOptions({ corretores: [] }));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        busca: debouncedSearch,
        page,
        limit: 12,
      };
      Object.keys(params).forEach((key) => {
        if (params[key] === "" || params[key] == null) delete params[key];
      });
      const response = await api.get("/clientes", { params });
      setClients(response.data.data);
      setMeta(response.data.meta);
    } catch (error) {
      toast.error(error.response?.data?.erro || "Erro ao carregar clientes.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filters, page, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const updateFilter = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters(initialFilters);
    setSearch("");
    setDebouncedSearch("");
    setPage(1);
  };

  const activeFilterCount = useMemo(() => (
    Object.entries(filters).filter(([key, value]) => (
      key !== "ordenacao"
      && key !== "ativo"
      && Boolean(value)
    )).length + (filters.ativo === "false" ? 1 : 0)
  ), [filters]);

  const remove = async () => {
    setDeleting(true);
    try {
      await api.delete(`/clientes/${deleteTarget.id}`);
      toast.success("Cliente desativado com sucesso.");
      setDeleteTarget(null);
      load();
    } catch (error) {
      toast.error(error.response?.data?.erro || "Erro ao desativar cliente.");
    } finally {
      setDeleting(false);
    }
  };

  const restore = async () => {
    setRestoring(true);
    try {
      await api.post(`/clientes/${restoreTarget.id}/reativar`);
      toast.success("Cliente reativado com sucesso.");
      setRestoreTarget(null);
      load();
    } catch (error) {
      toast.error(error.response?.data?.erro || "Erro ao reativar cliente.");
    } finally {
      setRestoring(false);
    }
  };

  const exportExcel = async () => {
    setExporting(true);
    try {
      const response = await api.get("/clientes/export/excel", {
        params: { ativo: filters.ativo },
        responseType: "blob",
      });
      downloadBlob(response.data, "clientes-sussai.xlsx");
      toast.success("Exportação Excel gerada.");
    } catch (error) {
      let message = "Erro ao exportar Excel.";
      const data = error.response?.data;
      if (data instanceof Blob) {
        try {
          const text = await data.text();
          const parsed = JSON.parse(text);
          message = parsed.erro || message;
        } catch {
          /* keep default */
        }
      } else if (data?.erro) {
        message = data.erro;
      }
      toast.error(message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <MainLayout title="Clientes">
      <Stack spacing={3}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "center" }} gap={2}>
          <Box>
            <Typography variant="h5" fontWeight={850}>Carteira de clientes</Typography>
            <Typography color="text.secondary">
              {meta.total} cliente(s) {filters.ativo === "false" ? "inativo(s)" : "ativos"}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.25} flexWrap="wrap" useFlexGap>
            <Button variant="outlined" startIcon={<FileDownloadOutlined />} loading={exporting} onClick={exportExcel}>
              Excel
            </Button>
            <Button variant="contained" size="large" startIcon={<Add />} onClick={() => navigate("/clientes/novo")}>
              Novo cliente
            </Button>
          </Stack>
        </Stack>

        <Card contentSx={{ p: { xs: 2, md: 2.25 }, "&:last-child": { pb: { xs: 2, md: 2.25 } } }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            <Input
              size="small"
              placeholder="Busque por nome, documento, e-mail, telefone ou tag"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search /></InputAdornment> } }}
              sx={{ flex: 1 }}
            />
            <Select
              size="small"
              label="Ordenar"
              value={filters.ordenacao}
              options={ORDENACOES_CLIENTE}
              onChange={(event) => updateFilter("ordenacao", event.target.value)}
              sx={{ minWidth: 190 }}
            />
            <Button
              color={filtersOpen ? "primary" : "inherit"}
              variant={filtersOpen ? "contained" : "outlined"}
              startIcon={<FilterAltOutlined />}
              onClick={() => setFiltersOpen((current) => !current)}
            >
              Filtros {activeFilterCount > 0 && `(${activeFilterCount})`}
            </Button>
          </Stack>

          <Collapse in={filtersOpen}>
            <Grid container spacing={2} sx={{ pt: 2.5 }}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Select
                  size="small"
                  label="Situação"
                  value={filters.ativo}
                  options={[
                    { value: "true", label: "Ativos" },
                    { value: "false", label: "Inativos" },
                  ]}
                  onChange={(event) => updateFilter("ativo", event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Select size="small" label="Tipo" value={filters.tipo} options={[{ value: "", label: "Todos" }, ...TIPOS_CLIENTE]} onChange={(event) => updateFilter("tipo", event.target.value)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Select size="small" label="Pessoa" value={filters.tipoPessoa} options={[{ value: "", label: "Todas" }, ...TIPOS_PESSOA]} onChange={(event) => updateFilter("tipoPessoa", event.target.value)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Select size="small" label="Status" value={filters.status} options={[{ value: "", label: "Todos" }, ...STATUS_CLIENTE]} onChange={(event) => updateFilter("status", event.target.value)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Select size="small" label="Interesse" value={filters.interesse} options={[{ value: "", label: "Todos" }, ...INTERESSES_CLIENTE]} onChange={(event) => updateFilter("interesse", event.target.value)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Select
                  size="small"
                  label="Corretor"
                  value={filters.corretorId}
                  options={[{ value: "", label: "Todos" }, ...(options.corretores || []).map((item) => ({ value: item.id, label: item.nome }))]}
                  onChange={(event) => updateFilter("corretorId", event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}><Input size="small" label="Cidade" value={filters.cidade} onChange={(event) => updateFilter("cidade", event.target.value)} /></Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}><Input size="small" label="Origem" value={filters.origem} onChange={(event) => updateFilter("origem", event.target.value)} /></Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}><Input size="small" label="Tag" value={filters.tag} onChange={(event) => updateFilter("tag", event.target.value)} /></Grid>
              <Grid size={{ xs: 6, sm: 3, md: 1.5 }}><Input size="small" type="number" label="Preço mín." value={filters.faixaPrecoMin} onChange={(event) => updateFilter("faixaPrecoMin", event.target.value)} /></Grid>
              <Grid size={{ xs: 6, sm: 3, md: 1.5 }}><Input size="small" type="number" label="Preço máx." value={filters.faixaPrecoMax} onChange={(event) => updateFilter("faixaPrecoMax", event.target.value)} /></Grid>
              <Grid size={{ xs: 12 }}><Button color="inherit" onClick={clearFilters}>Limpar filtros</Button></Grid>
            </Grid>
          </Collapse>
        </Card>

        {loading ? (
          <Loading variant="skeleton" rows={6} />
        ) : clients.length === 0 ? (
          <EmptyState
            title="Nenhum cliente encontrado"
            description="Ajuste os filtros ou cadastre o primeiro cliente da carteira."
            actionLabel="Cadastrar cliente"
            onAction={() => navigate("/clientes/novo")}
          />
        ) : (
          <Grid container spacing={2.5}>
            {clients.map((client) => {
              const status = statusMeta(client.status);
              const phone = client.telefones?.[0]?.numero || client.telefone || client.whatsapp;
              const email = client.emails?.[0]?.email || client.email;
              return (
                <Grid size={{ xs: 12, sm: 6, xl: 4 }} key={client.id}>
                  <Card
                    contentSx={{ p: 2.5 }}
                    sx={{ height: "100%", cursor: "pointer", transition: "transform .2s ease, box-shadow .2s ease", "&:hover": { transform: "translateY(-3px)", boxShadow: 8 } }}
                    onClick={() => navigate(`/clientes/${client.id}`)}
                  >
                    <Stack direction="row" spacing={2} alignItems="flex-start">
                      {client.avatarUrl ? (
                        <AuthenticatedImage
                          src={client.avatarUrl}
                          alt={client.nome}
                          sx={{ width: 56, height: 56, borderRadius: "50%", flexShrink: 0 }}
                        />
                      ) : (
                        <Avatar sx={{ width: 56, height: 56, bgcolor: "primary.main", fontWeight: 800 }}>
                          {(client.nome || "?").slice(0, 1).toUpperCase()}
                        </Avatar>
                      )}
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 0.75 }}>
                          <Chip size="small" label={status.label} color={status.color} sx={{ fontWeight: 750 }} />
                          <Chip size="small" variant="outlined" label={optionLabel(TIPOS_CLIENTE, client.tipo)} />
                          <Chip size="small" variant="outlined" label={optionLabel(TIPOS_PESSOA, client.tipoPessoa)} />
                        </Stack>
                        <Typography variant="h6" fontWeight={850} noWrap>{client.nome}</Typography>
                        <Typography color="text.secondary" variant="body2" noWrap>
                          {email || "Sem e-mail"} · {phone || "Sem telefone"}
                        </Typography>
                        <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }} noWrap>
                          {[client.cidade, client.estado].filter(Boolean).join(" — ") || "Sem cidade"}
                        </Typography>
                        {(client.interesses?.length > 0 || client.faixaPrecoMin != null || client.faixaPrecoMax != null) && (
                          <Typography variant="body2" color="primary.main" fontWeight={700} sx={{ mt: 1.25 }}>
                            {client.interesses?.map((item) => optionLabel(INTERESSES_CLIENTE, item)).join(" · ") || "Interesse"}
                            {(client.faixaPrecoMin != null || client.faixaPrecoMax != null) && (
                              <> · {formatCurrency(client.faixaPrecoMin)} – {formatCurrency(client.faixaPrecoMax)}</>
                            )}
                          </Typography>
                        )}
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2, pt: 1.75, borderTop: 1, borderColor: "divider" }}>
                          <Typography variant="body2" color="text.secondary">{client.corretor?.nome || "Sem corretor"}</Typography>
                          <Box onClick={(event) => event.stopPropagation()}>
                            <Tooltip title="Visualizar"><IconButton onClick={() => navigate(`/clientes/${client.id}`)}><VisibilityOutlined /></IconButton></Tooltip>
                            {client.ativo !== false && (
                              <>
                                <Tooltip title="Editar"><IconButton onClick={() => navigate(`/clientes/${client.id}/editar`)}><EditOutlined /></IconButton></Tooltip>
                                <Tooltip title="Desativar"><IconButton color="error" onClick={() => setDeleteTarget(client)}><DeleteOutlined /></IconButton></Tooltip>
                              </>
                            )}
                            {client.ativo === false && (
                              <Tooltip title="Reativar"><IconButton color="primary" onClick={() => setRestoreTarget(client)}><RestartAltOutlined /></IconButton></Tooltip>
                            )}
                          </Box>
                        </Stack>
                      </Box>
                    </Stack>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}

        {!loading && meta.totalPages > 1 && (
          <Stack alignItems="center" sx={{ pt: 1 }}>
            <Pagination page={page} count={meta.totalPages} color="primary" size="large" onChange={(event, value) => setPage(value)} />
          </Stack>
        )}
      </Stack>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={remove}
        loading={deleting}
        title="Desativar cliente"
        description={`O cliente “${deleteTarget?.nome || ""}” deixará de aparecer na carteira ativa.`}
        confirmLabel="Desativar"
      />
      <ConfirmDialog
        open={Boolean(restoreTarget)}
        onClose={() => setRestoreTarget(null)}
        onConfirm={restore}
        loading={restoring}
        title="Reativar cliente"
        description={`O cliente “${restoreTarget?.nome || ""}” voltará à carteira ativa.`}
        confirmLabel="Reativar"
      />
    </MainLayout>
  );
}
