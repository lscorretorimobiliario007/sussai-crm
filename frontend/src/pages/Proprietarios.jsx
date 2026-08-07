import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
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
  FilterAltOutlined,
  HomeWorkOutlined,
  RestartAltOutlined,
  Search,
  VisibilityOutlined,
} from "@mui/icons-material";
import MainLayout from "../components/layout/MainLayout";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import EmptyState from "../components/ui/EmptyState";
import Input from "../components/ui/Input";
import Loading from "../components/ui/Loading";
import Select from "../components/ui/Select";
import { useToast } from "../context/toast";
import api from "../api/axios";
import { formatCurrency } from "../utils/formatters";
import { formatCnpj, formatCpf, formatPhone } from "../utils/clientes";
import { getPropertyOwnerError } from "../utils/proprietarios";

const initialFilters = {
  cidade: "",
  ativo: "true",
};

export default function Proprietarios() {
  const navigate = useNavigate();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filters, setFilters] = useState(initialFilters);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [restoreTarget, setRestoreTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 350);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    api.get("/proprietarios/dashboard").then((res) => setDashboard(res.data)).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters, busca: debouncedSearch, page, limit: 12 };
      Object.keys(params).forEach((key) => { if (params[key] === "" || params[key] == null) delete params[key]; });
      const response = await api.get("/proprietarios", { params });
      setItems(response.data.data);
      setMeta(response.data.meta);
    } catch (error) {
      toast.error(getPropertyOwnerError(error, "Erro ao carregar proprietários."));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filters, page, toast]);

  useEffect(() => { load(); }, [load]);

  const updateFilter = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value }));
    setPage(1);
  };

  const activeFilterCount = useMemo(() => (
    Object.entries(filters).filter(([key, value]) => key !== "ativo" && Boolean(value)).length
    + (filters.ativo === "false" ? 1 : 0)
  ), [filters]);

  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`/proprietarios/${deleteTarget.id}`);
      toast.success("Proprietário desativado.");
      setDeleteTarget(null);
      load();
    } catch (error) {
      toast.error(getPropertyOwnerError(error, "Erro ao desativar."));
    } finally {
      setBusy(false);
    }
  };

  const restore = async () => {
    setBusy(true);
    try {
      await api.post(`/proprietarios/${restoreTarget.id}/reativar`);
      toast.success("Proprietário reativado.");
      setRestoreTarget(null);
      load();
    } catch (error) {
      toast.error(getPropertyOwnerError(error, "Erro ao reativar."));
    } finally {
      setBusy(false);
    }
  };

  const resumo = dashboard?.resumo;

  return (
    <MainLayout title="Proprietários">
      <Stack spacing={3}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={2}>
          <Box>
            <Typography variant="h5" fontWeight={850}>Proprietários</Typography>
            <Typography color="text.secondary">
              Captação e gestão de quem confia o patrimônio à sua imobiliária.
            </Typography>
          </Box>
          <Button variant="contained" size="large" startIcon={<Add />} onClick={() => navigate("/proprietarios/novo")}>
            Novo proprietário
          </Button>
        </Stack>

        <Grid container spacing={2}>
          {[
            { label: "Ativos", value: resumo?.total ?? "—" },
            { label: "Imóveis vinculados", value: resumo?.imoveis ?? "—" },
            { label: "Contratos ativos", value: resumo?.contratosAtivos ?? "—" },
            { label: "Carteira (venda)", value: formatCurrency(resumo?.valorVenda) },
          ].map((item) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={item.label}>
              <Card contentSx={{ p: 2 }}>
                <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                <Typography variant="h6" fontWeight={850}>{item.value}</Typography>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Card contentSx={{ p: { xs: 2, md: 2.25 } }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            <Input
              size="small"
              placeholder="Buscar por nome, documento, e-mail ou telefone"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search /></InputAdornment> } }}
              sx={{ flex: 1 }}
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
                <Select size="small" label="Situação" value={filters.ativo} options={[{ value: "true", label: "Ativos" }, { value: "false", label: "Inativos" }]} onChange={(event) => updateFilter("ativo", event.target.value)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Input size="small" label="Cidade" value={filters.cidade} onChange={(event) => updateFilter("cidade", event.target.value)} />
              </Grid>
            </Grid>
          </Collapse>
        </Card>

        {loading ? <Loading variant="skeleton" rows={6} /> : items.length === 0 ? (
          <EmptyState title="Nenhum proprietário" description="Cadastre o primeiro proprietário da carteira." actionLabel="Cadastrar" onAction={() => navigate("/proprietarios/novo")} />
        ) : (
          <Grid container spacing={2.5}>
            {items.map((item) => {
              const document = item.cpf
                ? formatCpf(item.cpf)
                : item.cnpj
                  ? formatCnpj(item.cnpj)
                  : "Sem documento";
              const phone = item.celular || item.telefone || item.whatsapp;
              return (
                <Grid size={{ xs: 12, sm: 6, xl: 4 }} key={item.id}>
                  <Card
                    contentSx={{ p: 2.5 }}
                    sx={{ height: "100%", cursor: "pointer", transition: "transform .2s ease", "&:hover": { transform: "translateY(-3px)", boxShadow: 8 } }}
                    onClick={() => navigate(`/proprietarios/${item.id}`)}
                  >
                    <Typography variant="h6" fontWeight={850} noWrap>{item.nome}</Typography>
                    <Typography color="text.secondary" variant="body2" noWrap>
                      {document} · {phone ? formatPhone(phone) : "Sem telefone"}
                    </Typography>
                    <Typography color="text.secondary" variant="body2" noWrap>
                      {item.email || "Sem e-mail"}
                    </Typography>
                    <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>
                      {[item.cidade, item.estado].filter(Boolean).join(" — ") || "Sem cidade"}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5 }} color="text.secondary">
                      <HomeWorkOutlined fontSize="small" />
                      <Typography variant="body2">{item._count?.properties || 0} imóvel(is)</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2, pt: 1.5, borderTop: 1, borderColor: "divider" }}>
                      <Typography variant="body2" color="text.secondary">{item.ativo === false ? "Inativo" : "Ativo"}</Typography>
                      <Box onClick={(event) => event.stopPropagation()}>
                        <Tooltip title="Ver"><IconButton onClick={() => navigate(`/proprietarios/${item.id}`)}><VisibilityOutlined /></IconButton></Tooltip>
                        {item.ativo !== false && (
                          <>
                            <Tooltip title="Editar"><IconButton onClick={() => navigate(`/proprietarios/${item.id}/editar`)}><EditOutlined /></IconButton></Tooltip>
                            <Tooltip title="Desativar"><IconButton color="error" onClick={() => setDeleteTarget(item)}><DeleteOutlined /></IconButton></Tooltip>
                          </>
                        )}
                        {item.ativo === false && (
                          <Tooltip title="Reativar"><IconButton color="primary" onClick={() => setRestoreTarget(item)}><RestartAltOutlined /></IconButton></Tooltip>
                        )}
                      </Box>
                    </Stack>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}

        {!loading && meta.totalPages > 1 && (
          <Stack alignItems="center"><Pagination page={page} count={meta.totalPages} color="primary" onChange={(event, value) => setPage(value)} /></Stack>
        )}
      </Stack>

      <ConfirmDialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} onConfirm={remove} loading={busy} title="Desativar proprietário" description={`“${deleteTarget?.nome || ""}” será desativado.`} confirmLabel="Desativar" />
      <ConfirmDialog open={Boolean(restoreTarget)} onClose={() => setRestoreTarget(null)} onConfirm={restore} loading={busy} title="Reativar proprietário" description={`“${restoreTarget?.nome || ""}” voltará à carteira.`} confirmLabel="Reativar" />
    </MainLayout>
  );
}
