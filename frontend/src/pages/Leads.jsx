import { useCallback, useEffect, useState } from "react";
import { Box, Chip, Grid, InputAdornment, Pagination, Stack, Typography } from "@mui/material";
import { Add, DeleteOutlined, Search } from "@mui/icons-material";
import MainLayout from "../components/layout/MainLayout";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import EmptyState from "../components/ui/EmptyState";
import Input from "../components/ui/Input";
import Loading from "../components/ui/Loading";
import Modal from "../components/ui/Modal";
import Select from "../components/ui/Select";
import { useToast } from "../context/toast";
import api from "../api/axios";
import { formatDateTime } from "../utils/formatters";

const STATUS_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "NOVO", label: "Novo" },
  { value: "PRIMEIRO_CONTATO", label: "Primeiro contato" },
  { value: "VISITA_AGENDADA", label: "Visita agendada" },
  { value: "PROPOSTA", label: "Proposta" },
  { value: "NEGOCIACAO", label: "Negociação" },
  { value: "FECHADO", label: "Fechado" },
  { value: "PERDIDO", label: "Perdido" },
];

const ORIGIN_OPTIONS = [
  { value: "MANUAL", label: "Manual" },
  { value: "SITE", label: "Site" },
  { value: "ZAP", label: "ZAP" },
  { value: "VIVA_REAL", label: "Viva Real" },
  { value: "IMOVELWEB", label: "Imovelweb" },
  { value: "OLX", label: "OLX" },
  { value: "MERCADO_LIVRE", label: "Mercado Livre" },
  { value: "FACEBOOK", label: "Facebook" },
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "GOOGLE", label: "Google" },
  { value: "OUTRO", label: "Outro" },
];

const emptyForm = {
  nome: "",
  email: "",
  telefone: "",
  whatsapp: "",
  origem: "MANUAL",
  propertyId: "",
  mensagem: "",
  observacoes: "",
};

function apiError(error, fallback) {
  const message = error.response?.data?.message ?? error.response?.data?.erro;
  return (Array.isArray(message) ? message.join(", ") : message) || fallback;
}

export default function Leads() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [stages, setStages] = useState([]);
  const [properties, setProperties] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 0, total: 0 });
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [origin, setOrigin] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    Promise.all([
      api.get("/pipeline/stages"),
      api.get("/properties", { params: { page: 1, limit: 100 } }),
    ]).then(([stageResponse, propertyResponse]) => {
      setStages(Array.isArray(stageResponse.data) ? stageResponse.data : []);
      setProperties(propertyResponse.data?.data || []);
    }).catch((error) => {
      toast.error(apiError(error, "Não foi possível carregar as opções do pipeline."));
    });
  }, [toast]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (status) params.status = status;
      if (origin) params.origem = origin;
      const { data } = await api.get("/leads", { params });
      setItems(data.data || []);
      setMeta(data.meta || { page: 1, totalPages: 0, total: 0 });
    } catch (error) {
      toast.error(apiError(error, "Erro ao carregar leads."));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, origin, page, status, toast]);

  useEffect(() => { load(); }, [load]);

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setForm(emptyForm);
  };

  const create = async () => {
    if (!form.nome.trim()) {
      toast.error("Informe o nome do lead.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        nome: form.nome.trim(),
        email: form.email.trim() || null,
        telefone: form.telefone.trim() || null,
        whatsapp: form.whatsapp.trim() || null,
        origem: form.origem,
        propertyId: form.propertyId ? Number(form.propertyId) : null,
        mensagem: form.mensagem.trim() || null,
        observacoes: form.observacoes.trim() || null,
      };
      await api.post("/leads", payload);
      toast.success("Lead cadastrado.");
      setModalOpen(false);
      setForm(emptyForm);
      load();
    } catch (error) {
      toast.error(apiError(error, "Erro ao cadastrar lead."));
    } finally {
      setSaving(false);
    }
  };

  const move = async (lead, stageId) => {
    if (!stageId || Number(stageId) === lead.stageId) return;
    try {
      await api.patch(`/leads/${lead.id}/move`, { stageId: Number(stageId) });
      toast.success("Lead movido.");
      load();
    } catch (error) {
      toast.error(apiError(error, "Erro ao mover lead."));
    }
  };

  const remove = async () => {
    setSaving(true);
    try {
      await api.delete(`/leads/${deleteTarget.id}`);
      toast.success("Lead desativado.");
      setDeleteTarget(null);
      load();
    } catch (error) {
      toast.error(apiError(error, "Erro ao desativar lead."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout title="Pipeline CRM">
      <Stack spacing={3}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={2}>
          <Box>
            <Typography variant="h5" fontWeight={850}>Leads</Typography>
            <Typography color="text.secondary">{meta.total || 0} oportunidade(s) ativa(s)</Typography>
          </Box>
          <Button variant="contained" startIcon={<Add />} onClick={() => setModalOpen(true)}>Novo lead</Button>
        </Stack>

        <Card>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Input
                size="small"
                placeholder="Buscar por nome, e-mail, telefone ou mensagem"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search /></InputAdornment> } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Select size="small" label="Situação" value={status} options={STATUS_OPTIONS} onChange={(event) => { setStatus(event.target.value); setPage(1); }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Select size="small" label="Origem" value={origin} options={[{ value: "", label: "Todas" }, ...ORIGIN_OPTIONS]} onChange={(event) => { setOrigin(event.target.value); setPage(1); }} />
            </Grid>
          </Grid>
        </Card>

        {loading ? <Loading variant="skeleton" rows={6} /> : items.length === 0 ? (
          <EmptyState title="Nenhum lead encontrado" description="Cadastre uma oportunidade para iniciar o pipeline." actionLabel="Novo lead" onAction={() => setModalOpen(true)} />
        ) : (
          <Grid container spacing={2.5}>
            {items.map((lead) => (
              <Grid size={{ xs: 12, md: 6, xl: 4 }} key={lead.id}>
                <Card sx={{ height: "100%" }}>
                  <Stack spacing={1.5}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="h6" fontWeight={850} noWrap>{lead.nome}</Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>{lead.email || lead.telefone || "Sem contato"}</Typography>
                      </Box>
                      <Chip size="small" label={ORIGIN_OPTIONS.find((item) => item.value === lead.origem)?.label || lead.origem} />
                    </Stack>
                    <Typography variant="body2">{lead.mensagem || lead.observacoes || "Sem observações."}</Typography>
                    {lead.property && (
                      <Typography variant="caption" color="text.secondary">
                        Imóvel: {lead.property.codigo} — {lead.property.titulo}
                      </Typography>
                    )}
                    <Select
                      size="small"
                      label="Etapa"
                      value={lead.stageId || ""}
                      options={stages.map((stage) => ({ value: stage.id, label: stage.nome }))}
                      onChange={(event) => move(lead, event.target.value)}
                    />
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="caption" color="text.secondary">{formatDateTime(lead.updatedAt)}</Typography>
                      <Button color="error" size="small" startIcon={<DeleteOutlined />} onClick={() => setDeleteTarget(lead)}>Desativar</Button>
                    </Stack>
                  </Stack>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {!loading && meta.totalPages > 1 && (
          <Stack alignItems="center">
            <Pagination page={page} count={meta.totalPages} color="primary" onChange={(_event, value) => setPage(value)} />
          </Stack>
        )}
      </Stack>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title="Novo lead"
        maxWidth="md"
        actions={(
          <>
            <Button color="inherit" onClick={closeModal} disabled={saving}>Cancelar</Button>
            <Button variant="contained" onClick={create} loading={saving}>Cadastrar</Button>
          </>
        )}
      >
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}><Input label="Nome" required value={form.nome} onChange={(event) => updateForm("nome", event.target.value)} /></Grid>
          <Grid size={{ xs: 12, md: 6 }}><Input type="email" label="E-mail" value={form.email} onChange={(event) => updateForm("email", event.target.value)} /></Grid>
          <Grid size={{ xs: 12, md: 3 }}><Input label="Telefone" value={form.telefone} onChange={(event) => updateForm("telefone", event.target.value)} /></Grid>
          <Grid size={{ xs: 12, md: 3 }}><Input label="WhatsApp" value={form.whatsapp} onChange={(event) => updateForm("whatsapp", event.target.value)} /></Grid>
          <Grid size={{ xs: 12, md: 4 }}><Select label="Origem" value={form.origem} options={ORIGIN_OPTIONS} onChange={(event) => updateForm("origem", event.target.value)} /></Grid>
          <Grid size={{ xs: 12, md: 8 }}><Select label="Imóvel" value={form.propertyId} options={[{ value: "", label: "Nenhum" }, ...properties.map((property) => ({ value: property.id, label: `${property.codigo} — ${property.titulo}` }))]} onChange={(event) => updateForm("propertyId", event.target.value)} /></Grid>
          <Grid size={{ xs: 12 }}><Input label="Mensagem" multiline rows={3} value={form.mensagem} onChange={(event) => updateForm("mensagem", event.target.value)} /></Grid>
          <Grid size={{ xs: 12 }}><Input label="Observações" multiline rows={3} value={form.observacoes} onChange={(event) => updateForm("observacoes", event.target.value)} /></Grid>
        </Grid>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={remove}
        loading={saving}
        title="Desativar lead"
        description={`“${deleteTarget?.nome || ""}” será removido do pipeline ativo.`}
        confirmLabel="Desativar"
      />
    </MainLayout>
  );
}
