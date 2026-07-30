import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Avatar, Box, Chip, Collapse, Grid, InputAdornment, LinearProgress, Pagination, Stack, Typography,
} from "@mui/material";
import {
  Add, EmojiEventsOutlined, FilterAltOutlined, Search,
} from "@mui/icons-material";
import MainLayout from "../components/layout/MainLayout";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import Input from "../components/ui/Input";
import Loading from "../components/ui/Loading";
import Select from "../components/ui/Select";
import { useToast } from "../components/ui/Toast";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import { formatCurrency } from "../utils/formatters";

const STATUS_OPTIONS = [
  { value: "ATIVO", label: "Ativo", color: "success" },
  { value: "FERIAS", label: "Férias", color: "warning" },
  { value: "INATIVO", label: "Inativo", color: "default" },
];

function statusMeta(value) {
  return STATUS_OPTIONS.find((item) => item.value === value) || { label: value, color: "default" };
}

export default function Corretores() {
  const navigate = useNavigate();
  const toast = useToast();
  const { usuario } = useAuth();
  const canManage = ["ADMIN", "GERENTE"].includes(usuario?.tipo);
  const [items, setItems] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [options, setOptions] = useState({ equipes: [] });
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filters, setFilters] = useState({ statusCorretor: "", equipeId: "" });
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 350);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    api.get("/corretores/opcoes").then((res) => setOptions(res.data)).catch(() => {});
    api.get("/corretores/dashboard").then((res) => setDashboard(res.data)).catch(() => {});
    api.get("/corretores/ranking").then((res) => setRanking(res.data.data || [])).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters, busca: debouncedSearch, page, limit: 12 };
      Object.keys(params).forEach((key) => { if (!params[key]) delete params[key]; });
      const response = await api.get("/corretores", { params });
      setItems(response.data.data);
      setMeta(response.data.meta);
    } catch (error) {
      toast.error(error.response?.data?.erro || "Erro ao carregar corretores.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filters, page, toast]);

  useEffect(() => { load(); }, [load]);

  const activeFilterCount = useMemo(() => Object.values(filters).filter(Boolean).length, [filters]);
  const resumo = dashboard?.resumo;

  return (
    <MainLayout title="Corretores">
      <Stack spacing={3}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={2}>
          <Box>
            <Typography variant="h5" fontWeight={850}>Equipe comercial</Typography>
            <Typography color="text.secondary">
              Performance, metas, CRECI e ranking da equipe em um só lugar.
            </Typography>
          </Box>
          {canManage && (
            <Button variant="contained" size="large" startIcon={<Add />} onClick={() => navigate("/corretores/novo")}>
              Novo corretor
            </Button>
          )}
        </Stack>

        <Grid container spacing={2}>
          {[
            { label: "Equipe", value: resumo?.total ?? "—" },
            { label: "Ativos", value: resumo?.ativos ?? "—" },
            { label: "Em férias", value: resumo?.ferias ?? "—" },
            { label: "Destaque do mês", value: dashboard?.destaque?.nome || "—" },
          ].map((item) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={item.label}>
              <Card contentSx={{ p: 2 }}>
                <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                <Typography variant="h6" fontWeight={850} noWrap>{item.value}</Typography>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Card>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <EmojiEventsOutlined color="primary" />
            <Typography variant="h6" fontWeight={800}>Ranking do mês</Typography>
          </Stack>
          <Stack spacing={1.25}>
            {ranking.slice(0, 5).map((item) => (
              <Box key={item.id} sx={{ cursor: "pointer" }} onClick={() => navigate(`/corretores/${item.id}`)}>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                  <Typography fontWeight={750}>#{item.posicao} {item.nome}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatCurrency(item.indicadores?.valorVendasMes)} · conv. {item.indicadores?.conversao}%
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(100, item.indicadores?.progressoMeta ?? (item.indicadores?.valorVendasMes ? 40 : 5))}
                  sx={{ height: 8, borderRadius: 999 }}
                />
              </Box>
            ))}
            {ranking.length === 0 && <Typography color="text.secondary">Sem dados de ranking.</Typography>}
          </Stack>
        </Card>

        <Card contentSx={{ p: { xs: 2, md: 2.25 } }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            <Input
              size="small"
              placeholder="Buscar por nome, e-mail, CRECI ou telefone"
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
              <Grid size={{ xs: 12, md: 4 }}>
                <Select size="small" label="Status" value={filters.statusCorretor} options={[{ value: "", label: "Todos" }, ...STATUS_OPTIONS]} onChange={(event) => { setFilters((current) => ({ ...current, statusCorretor: event.target.value })); setPage(1); }} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Select size="small" label="Equipe" value={filters.equipeId} options={[{ value: "", label: "Todas" }, ...(options.equipes || []).map((item) => ({ value: item.id, label: item.nome }))]} onChange={(event) => { setFilters((current) => ({ ...current, equipeId: event.target.value })); setPage(1); }} />
              </Grid>
            </Grid>
          </Collapse>
        </Card>

        {loading ? <Loading variant="skeleton" rows={6} /> : items.length === 0 ? (
          <EmptyState title="Nenhum corretor" description="Cadastre a equipe comercial." actionLabel={canManage ? "Cadastrar" : undefined} onAction={canManage ? () => navigate("/corretores/novo") : undefined} />
        ) : (
          <Grid container spacing={2.5}>
            {items.map((item) => {
              const status = statusMeta(item.statusCorretor);
              const ind = item.indicadores || {};
              return (
                <Grid size={{ xs: 12, sm: 6, xl: 4 }} key={item.id}>
                  <Card
                    contentSx={{ p: 2.5 }}
                    sx={{ height: "100%", cursor: "pointer", transition: "transform .2s ease", "&:hover": { transform: "translateY(-3px)", boxShadow: 8 } }}
                    onClick={() => navigate(`/corretores/${item.id}`)}
                  >
                    <Stack direction="row" spacing={2}>
                      <Avatar sx={{ width: 56, height: 56, bgcolor: "primary.main", fontWeight: 800 }}>
                        {(item.nome || "?").slice(0, 1).toUpperCase()}
                      </Avatar>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Chip size="small" label={status.label} color={status.color} sx={{ fontWeight: 750, mb: 0.75 }} />
                        <Typography variant="h6" fontWeight={850} noWrap>{item.nome}</Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          CRECI {item.creci || "—"} · {item.equipe?.nome || "Sem equipe"}
                        </Typography>
                      </Box>
                    </Stack>
                    <Grid container spacing={1} sx={{ mt: 2 }}>
                      <Grid size={6}><Typography variant="caption" color="text.secondary">Vendas mês</Typography><Typography fontWeight={800}>{formatCurrency(ind.valorVendasMes)}</Typography></Grid>
                      <Grid size={6}><Typography variant="caption" color="text.secondary">Conversão</Typography><Typography fontWeight={800}>{ind.conversao ?? 0}%</Typography></Grid>
                      <Grid size={6}><Typography variant="caption" color="text.secondary">Captações</Typography><Typography fontWeight={800}>{ind.captacoes ?? 0}</Typography></Grid>
                      <Grid size={6}><Typography variant="caption" color="text.secondary">Comissão prev.</Typography><Typography fontWeight={800}>{formatCurrency(ind.comissaoPrevista)}</Typography></Grid>
                    </Grid>
                    {ind.metaMensal > 0 && (
                      <Box sx={{ mt: 1.5 }}>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="caption" color="text.secondary">Meta mensal</Typography>
                          <Typography variant="caption" fontWeight={750}>{ind.progressoMeta}%</Typography>
                        </Stack>
                        <LinearProgress variant="determinate" value={ind.progressoMeta || 0} sx={{ height: 8, borderRadius: 999, mt: 0.5 }} />
                      </Box>
                    )}
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
    </MainLayout>
  );
}
