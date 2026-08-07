import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Chip,
  Collapse,
  Grid,
  IconButton,
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
import { useToast } from "../context/toast";
import api from "../api/axios";
import { formatCurrency } from "../utils/formatters";
import {
  FINALIDADES_IMOVEL,
  TIPOS_IMOVEL,
  optionLabel,
} from "../utils/imoveis";

const initialFilters = {
  finalidade: "",
  tipo: "",
  cidade: "",
  bairro: "",
  publicado: "",
};

export default function Imoveis() {
  const navigate = useNavigate();
  const toast = useToast();
  const [properties, setProperties] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (filters.tipo) params.tipo = filters.tipo;
      if (filters.finalidade) params.finalidade = filters.finalidade;
      if (filters.cidade) params.cidade = filters.cidade;
      if (filters.bairro) params.bairro = filters.bairro;
      if (filters.publicado) params.publicado = filters.publicado;
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
  }, [filters, page, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const updateFilter = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters(initialFilters);
    setPage(1);
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

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

  return (
    <MainLayout title="Imóveis">
      <Stack spacing={3}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "center" }} gap={2}>
          <Box>
            <Typography variant="h5" fontWeight={850}>Portfólio imobiliário</Typography>
            <Typography color="text.secondary">
              {meta.total} imóvel(is) no catálogo
            </Typography>
          </Box>
          <Button variant="contained" size="large" startIcon={<Add />} onClick={() => navigate("/imoveis/novo")}>
            Novo imóvel
          </Button>
        </Stack>

        <Card contentSx={{ p: { xs: 2, md: 2.25 }, "&:last-child": { pb: { xs: 2, md: 2.25 } } }}>
          <Stack direction="row" justifyContent="flex-end">
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
                  label="Publicação"
                  value={filters.publicado}
                  options={[
                    { value: "", label: "Todos" },
                    { value: "true", label: "Publicados" },
                    { value: "false", label: "Não publicados" },
                  ]}
                  onChange={(event) => updateFilter("publicado", event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}><Select size="small" label="Finalidade" value={filters.finalidade} options={[{ value: "", label: "Todas" }, ...FINALIDADES_IMOVEL]} onChange={(event) => updateFilter("finalidade", event.target.value)} /></Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}><Select size="small" label="Tipo" value={filters.tipo} options={[{ value: "", label: "Todos" }, ...TIPOS_IMOVEL]} onChange={(event) => updateFilter("tipo", event.target.value)} /></Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}><Input size="small" label="Cidade" value={filters.cidade} onChange={(event) => updateFilter("cidade", event.target.value)} /></Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}><Input size="small" label="Bairro" value={filters.bairro} onChange={(event) => updateFilter("bairro", event.target.value)} /></Grid>
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
              const value = property.finalidade === "LOCACAO" ? property.valorLocacao : property.valorVenda;
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
                        <Chip size="small" label={property.publicado ? "Publicado" : "Não publicado"} color={property.publicado ? "success" : "default"} sx={{ fontWeight: 750 }} />
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
                        <Typography variant="body2" color="text.secondary">{property.proprietario?.nome || "Sem proprietário"}</Typography>
                        <Box onClick={(event) => event.stopPropagation()}>
                          <Tooltip title="Visualizar"><IconButton onClick={() => navigate(`/imoveis/${property.id}`)}><VisibilityOutlined /></IconButton></Tooltip>
                          {property.ativo !== false && (
                            <>
                              <Tooltip title="Editar"><IconButton onClick={() => navigate(`/imoveis/${property.id}/editar`)}><EditOutlined /></IconButton></Tooltip>
                              <Tooltip title="Desativar"><IconButton color="error" onClick={() => setDeleteTarget(property)}><DeleteOutlined /></IconButton></Tooltip>
                            </>
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
    </MainLayout>
  );
}
