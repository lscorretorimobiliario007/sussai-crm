import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
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
  BathtubOutlined,
  BedOutlined,
  DeleteOutlined,
  DirectionsCarOutlined,
  EditOutlined,
  FilterAltOutlined,
  RestartAltOutlined,
  Search,
  SquareFootOutlined,
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
import { formatCurrency, STATUS_IMOVEL } from "../utils/formatters";
import {
  FILTROS_CARACTERISTICAS_SITE,
  FINALIDADES_IMOVEL,
  OCUPACOES_IMOVEL,
  ORDENACOES_IMOVEL,
  STATUS_OPTIONS,
  TIPOS_IMOVEL,
  optionLabel,
} from "../utils/imoveis";

const BOOL_FILTER_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "true", label: "Sim" },
  { value: "false", label: "Não" },
];

const initialFilters = {
  status: "",
  finalidade: "",
  tipo: "",
  cidade: "",
  bairro: "",
  corretorId: "",
  proprietarioId: "",
  valorMin: "",
  valorMax: "",
  quartosMin: "",
  banheirosMin: "",
  vagasMin: "",
  ordenacao: "recentes",
  caracteristicas: [],
  ocupacao: "",
  exclusividade: "",
  aceitaFinanciamento: "",
  aceitaPermuta: "",
  chaveRetirada: "",
  ativo: "true",
};

export default function Imoveis() {
  const navigate = useNavigate();
  const toast = useToast();
  const [properties, setProperties] = useState([]);
  const [options, setOptions] = useState({ corretores: [], proprietarios: [] });
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

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timeout);
  }, [search]);

useEffect(() => {
  setOptions({
    corretores: [],
    proprietarios: [],
  });
}, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
   const params = {
  page,
  limit: 12,
};

if (filters.tipo) params.tipo = filters.tipo;
if (filters.finalidade) params.finalidade = filters.finalidade;
if (filters.cidade) params.cidade = filters.cidade;
if (filters.bairro) params.bairro = filters.bairro;
      Object.keys(params).forEach((key) => {
        if (params[key] === "" || params[key] == null) delete params[key];
      });
     const response = await api.get("/properties", { params });
      setProperties(response.data.data);
      setMeta(response.data.meta);
    } catch (error) {
      toast.error(error.response?.data?.erro || "Erro ao carregar imóveis.");
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

  const toggleFeature = (feature) => {
    setFilters((current) => ({
      ...current,
      caracteristicas: current.caracteristicas.includes(feature)
        ? current.caracteristicas.filter((item) => item !== feature)
        : [...current.caracteristicas, feature],
    }));
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
      && (Array.isArray(value) ? value.length > 0 : Boolean(value))
    )).length + (filters.ativo === "false" ? 1 : 0)
  ), [filters]);

  const remove = async () => {
    setDeleting(true);
    try {
     await api.delete(`/properties/${deleteTarget.id}`);
      toast.success("Imóvel desativado com sucesso.");
      setDeleteTarget(null);
      load();
    } catch (error) {
      toast.error(error.response?.data?.erro || "Erro ao desativar imóvel.");
    } finally {
      setDeleting(false);
    }
  };

  const restore = async () => {
    setRestoring(true);
    try {
      await api.patch(`/properties/${restoreTarget.id}/restore`);
      toast.success("Imóvel reativado com sucesso.");
      setRestoreTarget(null);
      load();
    } catch (error) {
      toast.error(error.response?.data?.erro || "Erro ao reativar imóvel.");
    } finally {
      setRestoring(false);
    }
  };

  return (
    <MainLayout title="Imóveis">
      <Stack spacing={3}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "center" }} gap={2}>
          <Box>
            <Typography variant="h5" fontWeight={850}>Portfólio imobiliário</Typography>
            <Typography color="text.secondary">
              {meta.total} imóvel(is) {filters.ativo === "false" ? "inativo(s)" : "no catálogo"}
            </Typography>
          </Box>
          <Button variant="contained" size="large" startIcon={<Add />} onClick={() => navigate("/imoveis/novo")}>
            Novo imóvel
          </Button>
        </Stack>

        <Card contentSx={{ p: { xs: 2, md: 2.25 }, "&:last-child": { pb: { xs: 2, md: 2.25 } } }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            <Input
              size="small"
              placeholder="Busque por título, código, endereço, bairro ou cidade"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search /></InputAdornment> } }}
              sx={{ flex: 1 }}
            />
            <Select size="small" label="Ordenar" value={filters.ordenacao} options={ORDENACOES_IMOVEL} onChange={(event) => updateFilter("ordenacao", event.target.value)} sx={{ minWidth: 190 }} />
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
              <Grid size={{ xs: 12, sm: 6, md: 3 }}><Select size="small" label="Status" value={filters.status} options={[{ value: "", label: "Todos" }, ...STATUS_OPTIONS]} onChange={(event) => updateFilter("status", event.target.value)} /></Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}><Select size="small" label="Finalidade" value={filters.finalidade} options={[{ value: "", label: "Todas" }, ...FINALIDADES_IMOVEL]} onChange={(event) => updateFilter("finalidade", event.target.value)} /></Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}><Select size="small" label="Tipo" value={filters.tipo} options={[{ value: "", label: "Todos" }, ...TIPOS_IMOVEL]} onChange={(event) => updateFilter("tipo", event.target.value)} /></Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}><Input size="small" label="Cidade" value={filters.cidade} onChange={(event) => updateFilter("cidade", event.target.value)} /></Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}><Input size="small" label="Bairro" value={filters.bairro} onChange={(event) => updateFilter("bairro", event.target.value)} /></Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}><Select size="small" label="Corretor" value={filters.corretorId} options={[{ value: "", label: "Todos" }, ...options.corretores.map((item) => ({ value: item.id, label: item.nome }))]} onChange={(event) => updateFilter("corretorId", event.target.value)} /></Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}><Select size="small" label="Proprietário" value={filters.proprietarioId} options={[{ value: "", label: "Todos" }, ...options.proprietarios.map((item) => ({ value: item.id, label: item.nome }))]} onChange={(event) => updateFilter("proprietarioId", event.target.value)} /></Grid>
              <Grid size={{ xs: 6, sm: 3, md: 1.5 }}><Input size="small" type="number" label="Valor mín." value={filters.valorMin} onChange={(event) => updateFilter("valorMin", event.target.value)} /></Grid>
              <Grid size={{ xs: 6, sm: 3, md: 1.5 }}><Input size="small" type="number" label="Valor máx." value={filters.valorMax} onChange={(event) => updateFilter("valorMax", event.target.value)} /></Grid>
              <Grid size={{ xs: 4, md: 1 }}><Input size="small" type="number" label="Quartos" value={filters.quartosMin} onChange={(event) => updateFilter("quartosMin", event.target.value)} /></Grid>
              <Grid size={{ xs: 4, md: 1 }}><Input size="small" type="number" label="Banheiros" value={filters.banheirosMin} onChange={(event) => updateFilter("banheirosMin", event.target.value)} /></Grid>
              <Grid size={{ xs: 4, md: 1 }}><Input size="small" type="number" label="Vagas" value={filters.vagasMin} onChange={(event) => updateFilter("vagasMin", event.target.value)} /></Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}><Select size="small" label="Ocupação" value={filters.ocupacao} options={[{ value: "", label: "Todas" }, ...OCUPACOES_IMOVEL]} onChange={(event) => updateFilter("ocupacao", event.target.value)} /></Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}><Select size="small" label="Exclusividade" value={filters.exclusividade} options={BOOL_FILTER_OPTIONS} onChange={(event) => updateFilter("exclusividade", event.target.value)} /></Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}><Select size="small" label="Aceita financiamento" value={filters.aceitaFinanciamento} options={BOOL_FILTER_OPTIONS} onChange={(event) => updateFilter("aceitaFinanciamento", event.target.value)} /></Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}><Select size="small" label="Aceita permuta" value={filters.aceitaPermuta} options={BOOL_FILTER_OPTIONS} onChange={(event) => updateFilter("aceitaPermuta", event.target.value)} /></Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}><Select size="small" label="Chave retirada" value={filters.chaveRetirada} options={BOOL_FILTER_OPTIONS} onChange={(event) => updateFilter("chaveRetirada", event.target.value)} /></Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1, fontWeight: 700 }}>
                  Comodidades (CRM + site)
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  {FILTROS_CARACTERISTICAS_SITE.map((item) => (
                    <Chip key={item.value} label={item.label} clickable color={filters.caracteristicas.includes(item.value) ? "primary" : "default"} variant={filters.caracteristicas.includes(item.value) ? "filled" : "outlined"} onClick={() => toggleFeature(item.value)} />
                  ))}
                </Stack>
              </Grid>
              <Grid size={{ xs: 12 }}><Button color="inherit" onClick={clearFilters}>Limpar filtros</Button></Grid>
            </Grid>
          </Collapse>
        </Card>

        {loading ? (
          <Loading variant="skeleton" rows={6} />
        ) : properties.length === 0 ? (
          <EmptyState
            title="Nenhum imóvel encontrado"
            description="Ajuste os filtros ou cadastre o primeiro imóvel do portfólio."
            actionLabel="Cadastrar imóvel"
            onAction={() => navigate("/imoveis/novo")}
          />
        ) : (
          <Grid container spacing={2.5}>
            {properties.map((property) => {
              const photo = property.images?.[0];
              const value = property.finalidade === "LOCACAO" ? property.valorAluguel : property.valorVenda || property.valorAluguel;
              return (
                <Grid size={{ xs: 12, sm: 6, xl: 4 }} key={property.id}>
                  <Card
                    contentSx={{ p: 0, "&:last-child": { pb: 0 } }}
                    sx={{ height: "100%", cursor: "pointer", transition: "transform .2s ease, box-shadow .2s ease", "&:hover": { transform: "translateY(-3px)", boxShadow: 8 } }}
                    onClick={() => navigate(`/imoveis/${property.id}`)}
                  >
                    <Box sx={{ position: "relative" }}>
                     <AuthenticatedImage
  src={
    photo
      ? `/uploads/${photo.filePath}`
      : null
  }
  alt={property.titulo}
  sx={{ width: "100%", height: 220 }}
/>
                      <Stack direction="row" spacing={1} sx={{ position: "absolute", top: 14, left: 14, right: 14, justifyContent: "space-between" }}>
                        <Chip size="small" label={STATUS_IMOVEL[property.status]?.label || property.status} color={STATUS_IMOVEL[property.status]?.color || "default"} sx={{ fontWeight: 750 }} />
                        <Chip size="small" label={property.codigo} sx={{ bgcolor: "rgba(15,23,42,.82)", color: "white", fontWeight: 750 }} />
                      </Stack>
                    </Box>
                    <Box sx={{ p: 2.5 }}>
                      <Typography variant="overline" color="primary.main" fontWeight={800}>
                        {optionLabel(TIPOS_IMOVEL, property.tipo)} • {optionLabel(FINALIDADES_IMOVEL, property.finalidade)}
                      </Typography>
                      <Typography variant="h6" fontWeight={850} noWrap>{property.titulo}</Typography>
                      <Typography color="text.secondary" variant="body2" noWrap>{property.bairro}, {property.cidade} — {property.estado}</Typography>
                      <Typography variant="h6" color="primary.main" fontWeight={850} sx={{ my: 2 }}>
                        {formatCurrency(value)}
                        {property.finalidade === "LOCACAO" && <Typography component="span" variant="caption"> /mês</Typography>}
                      </Typography>
                      <Stack direction="row" spacing={2.25} color="text.secondary">
                        <Stack direction="row" spacing={0.5} alignItems="center"><BedOutlined fontSize="small" /><Typography variant="caption">{property.quartos}</Typography></Stack>
                        <Stack direction="row" spacing={0.5} alignItems="center"><BathtubOutlined fontSize="small" /><Typography variant="caption">{property.banheiros}</Typography></Stack>
                        <Stack direction="row" spacing={0.5} alignItems="center"><DirectionsCarOutlined fontSize="small" /><Typography variant="caption">{property.vagas}</Typography></Stack>
                        <Stack direction="row" spacing={0.5} alignItems="center"><SquareFootOutlined fontSize="small" /><Typography variant="caption">{property.areaUtil || property.areaConstruida || "—"} m²</Typography></Stack>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2.5, pt: 2, borderTop: 1, borderColor: "divider" }}>
                        <Typography variant="body2" color="text.secondary">{property.corretor?.nome || "Sem corretor"}</Typography>
                        <Box onClick={(event) => event.stopPropagation()}>
                          <Tooltip title="Visualizar"><IconButton onClick={() => navigate(`/imoveis/${property.id}`)}><VisibilityOutlined /></IconButton></Tooltip>
                          {property.ativo !== false && (
                            <>
                              <Tooltip title="Editar"><IconButton onClick={() => navigate(`/imoveis/${property.id}/editar`)}><EditOutlined /></IconButton></Tooltip>
                              <Tooltip title="Desativar"><IconButton color="error" onClick={() => setDeleteTarget(property)}><DeleteOutlined /></IconButton></Tooltip>
                            </>
                          )}
                          {property.ativo === false && (
                            <Tooltip title="Reativar"><IconButton color="primary" onClick={() => setRestoreTarget(property)}><RestartAltOutlined /></IconButton></Tooltip>
                          )}
                        </Box>
                      </Stack>
                    </Box>
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
        title="Desativar imóvel"
        description={`O imóvel “${deleteTarget?.titulo || ""}” deixará de aparecer no portfólio. Contratos ativos impedem esta ação.`}
        confirmLabel="Desativar"
      />
      <ConfirmDialog
        open={Boolean(restoreTarget)}
        onClose={() => setRestoreTarget(null)}
        onConfirm={restore}
        loading={restoring}
        title="Reativar imóvel"
        description={`O imóvel “${restoreTarget?.titulo || ""}” voltará ao portfólio com status Disponível.`}
        confirmLabel="Reativar"
      />
    </MainLayout>
  );
}
