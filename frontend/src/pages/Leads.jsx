import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Chip,
  Collapse,
  Drawer,
  Grid,
  InputAdornment,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import {
  Add,
  AttachFileOutlined,
  CalendarMonthOutlined,
  CommentOutlined,
  FilterAltOutlined,
  Search,
  TaskAltOutlined,
  TrendingUp,
} from "@mui/icons-material";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDroppable } from "@dnd-kit/core";
import MainLayout from "../components/layout/MainLayout";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import Input from "../components/ui/Input";
import Loading from "../components/ui/Loading";
import Modal from "../components/ui/Modal";
import Select from "../components/ui/Select";
import { useToast } from "../components/ui/Toast";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import { formatCurrency, formatDateTime } from "../utils/formatters";
import { HISTORY_LABELS, probabilidadeLabel } from "../utils/pipeline";

const emptyForm = {
  titulo: "",
  valor: "",
  valorPrevisto: "",
  probabilidade: 10,
  previsaoFechamento: "",
  origem: "",
  notas: "",
  clienteId: "",
  imovelId: "",
  corretorId: "",
  etapaId: "",
};

function LeadCardContent({ lead, overlay = false }) {
  return (
    <Box
      sx={{
        p: 1.75,
        mb: overlay ? 0 : 1.25,
        borderRadius: 2.5,
        bgcolor: "background.paper",
        border: 1,
        borderColor: "divider",
        cursor: "grab",
        boxShadow: overlay ? 8 : "0 1px 2px rgba(15,23,42,.04)",
        transition: "transform .16s ease, box-shadow .16s ease",
        "&:hover": { transform: overlay ? undefined : "translateY(-2px)", boxShadow: 4 },
        width: overlay ? 280 : "auto",
      }}
    >
      <Typography fontWeight={850} sx={{ mb: 0.75, lineHeight: 1.3 }}>{lead.titulo}</Typography>
      <Typography variant="body2" color="text.secondary" noWrap>
        {lead.cliente?.nome || "Sem cliente"} · {lead.corretor?.nome || "Sem corretor"}
      </Typography>
      {lead.imovel && (
        <Typography variant="caption" color="text.secondary" display="block" noWrap sx={{ mt: 0.25 }}>
          {lead.imovel.codigo} — {lead.imovel.titulo}
        </Typography>
      )}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1.25 }}>
        <Typography fontWeight={800} color="primary.main">
          {formatCurrency(lead.valorPrevisto ?? lead.valor)}
        </Typography>
        <Chip size="small" label={probabilidadeLabel(lead.probabilidade)} sx={{ fontWeight: 750 }} />
      </Stack>
      <Stack direction="row" spacing={1} sx={{ mt: 1 }} color="text.secondary">
        <Stack direction="row" spacing={0.35} alignItems="center"><CommentOutlined sx={{ fontSize: 14 }} /><Typography variant="caption">{lead._count?.comentarios || 0}</Typography></Stack>
        <Stack direction="row" spacing={0.35} alignItems="center"><AttachFileOutlined sx={{ fontSize: 14 }} /><Typography variant="caption">{lead._count?.anexos || 0}</Typography></Stack>
        <Stack direction="row" spacing={0.35} alignItems="center"><TaskAltOutlined sx={{ fontSize: 14 }} /><Typography variant="caption">{lead._count?.tarefas || 0}</Typography></Stack>
        <Stack direction="row" spacing={0.35} alignItems="center"><CalendarMonthOutlined sx={{ fontSize: 14 }} /><Typography variant="caption">{lead._count?.eventosAgenda || 0}</Typography></Stack>
      </Stack>
    </Box>
  );
}

function LeadCard({ lead, onOpen }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: String(lead.id),
    data: { lead },
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onOpen?.(lead)}
    >
      <LeadCardContent lead={lead} />
    </Box>
  );
}

function EtapaColumn({ etapa, leads, onOpen }) {
  const { setNodeRef, isOver } = useDroppable({ id: `etapa-${etapa.id}`, data: { etapa } });
  const valor = leads.reduce((sum, lead) => sum + (lead.valorPrevisto ?? lead.valor ?? 0), 0);

  return (
    <Box
      ref={setNodeRef}
      sx={{
        minWidth: { xs: 280, md: 300 },
        flex: "0 0 auto",
        bgcolor: isOver ? "action.hover" : "transparent",
        borderRadius: 3,
        p: 1,
        transition: "background-color .16s ease",
      }}
    >
      <Box sx={{ px: 1, pb: 1.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: etapa.cor }} />
            <Typography fontWeight={850}>{etapa.nome}</Typography>
          </Stack>
          <Chip size="small" label={leads.length} sx={{ fontWeight: 800 }} />
        </Stack>
        <Typography variant="caption" color="text.secondary">{formatCurrency(valor)}</Typography>
      </Box>
      <Box sx={{ minHeight: 120, maxHeight: "calc(100vh - 340px)", overflowY: "auto", px: 0.5 }}>
        <SortableContext items={leads.map((lead) => String(lead.id))} strategy={verticalListSortingStrategy}>
          {leads.map((lead) => <LeadCard key={lead.id} lead={lead} onOpen={onOpen} />)}
        </SortableContext>
        {leads.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ px: 1, py: 2 }}>
            Arraste oportunidades para cá
          </Typography>
        )}
      </Box>
    </Box>
  );
}

export default function Leads() {
  const toast = useToast();
  const { usuario } = useAuth();
  const [leads, setLeads] = useState([]);
  const [etapas, setEtapas] = useState([]);
  const [options, setOptions] = useState({ corretores: [], clientes: [], imoveis: [], motivosPerda: [] });
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState({ corretorId: "", clienteId: "", imovelId: "", origem: "" });
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeLead, setActiveLead] = useState(null);
  const [lossDialog, setLossDialog] = useState(null);
  const [motivoPerda, setMotivoPerda] = useState("");
  const [comment, setComment] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [agendaForm, setAgendaForm] = useState({ titulo: "", tipo: "VISITA", dataInicio: "", dataFim: "" });
  const [etapaFormOpen, setEtapaFormOpen] = useState(false);
  const [etapaForm, setEtapaForm] = useState({ nome: "", codigo: "", cor: "#2563eb", tipo: "ABERTA", probabilidadePadrao: 30 });
  const [busy, setBusy] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const canManageStages = ["ADMIN", "GERENTE"].includes(usuario?.tipo);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(timeout);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters, busca: debouncedSearch };
      Object.keys(params).forEach((key) => { if (!params[key]) delete params[key]; });
      const [board, dash, opts] = await Promise.all([
        api.get("/leads", { params }),
        api.get("/leads/dashboard"),
        api.get("/leads/opcoes"),
      ]);
      setLeads(board.data.data || []);
      setEtapas(board.data.etapas || opts.data.etapas || []);
      setDashboard(dash.data);
      setOptions(opts.data);
    } catch (error) {
      toast.error(error.response?.data?.erro || "Erro ao carregar pipeline.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filters, toast]);

  useEffect(() => { load(); }, [load]);

  const loadDetail = useCallback(async (id) => {
    setDetailLoading(true);
    try {
      const response = await api.get(`/leads/${id}`);
      setDetail(response.data);
    } catch (error) {
      toast.error(error.response?.data?.erro || "Erro ao abrir oportunidade.");
      setSelectedId(null);
    } finally {
      setDetailLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (selectedId) loadDetail(selectedId);
  }, [loadDetail, selectedId]);

  const leadsByEtapa = useMemo(() => {
    const map = {};
    for (const etapa of etapas) map[etapa.id] = [];
    for (const lead of leads) {
      if (lead.etapaId && map[lead.etapaId]) map[lead.etapaId].push(lead);
      else if (etapas[0]) {
        map[etapas[0].id] = map[etapas[0].id] || [];
        map[etapas[0].id].push(lead);
      }
    }
    return map;
  }, [etapas, leads]);

  const openCreate = () => {
    setForm({
      ...emptyForm,
      etapaId: etapas.find((item) => item.tipo === "ABERTA")?.id || "",
      corretorId: usuario?.id || "",
      probabilidade: etapas.find((item) => item.tipo === "ABERTA")?.probabilidadePadrao || 10,
    });
    setFormOpen(true);
  };

  const saveLead = async () => {
    if (!form.titulo.trim()) {
      toast.error("Informe o título da oportunidade.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/leads", {
        nome: form.titulo.trim(),
        titulo: form.titulo.trim(),
        origem: form.origem || "MANUAL",
        mensagem: form.observacoes || null,
        observacoes: form.observacoes || null,
        imovelId: form.imovelId ? Number(form.imovelId) : null,
        corretorId: form.corretorId ? Number(form.corretorId) : null,
        etapaId: form.etapaId ? Number(form.etapaId) : null,
        propertyId: form.imovelId ? Number(form.imovelId) : null,
        assignedUserId: form.corretorId ? Number(form.corretorId) : null,
      });
      toast.success("Oportunidade criada.");
      setFormOpen(false);
      load();
    } catch (error) {
      toast.error(error.response?.data?.erro || "Erro ao criar oportunidade.");
    } finally {
      setSaving(false);
    }
  };

  const moveLead = async (leadId, etapaId, motivo = null) => {
    try {
      await api.patch(`/leads/${leadId}/move`, {
        stageId: Number(etapaId),
        ...(motivo ? { observacao: motivo } : {}),
      });
      toast.success("Oportunidade movida.");
      await load();
      if (selectedId === leadId) loadDetail(leadId);
    } catch (error) {
      toast.error(error.response?.data?.erro || "Não foi possível mover.");
      load();
    }
  };

  const onDragStart = (event) => {
    const lead = event.active.data.current?.lead || leads.find((item) => String(item.id) === String(event.active.id));
    setActiveLead(lead || null);
  };

  const onDragEnd = async (event) => {
    setActiveLead(null);
    const { active, over } = event;
    if (!over) return;
    const leadId = Number(active.id);
    const overId = String(over.id);
    let targetEtapaId = null;
    if (overId.startsWith("etapa-")) {
      targetEtapaId = Number(overId.replace("etapa-", ""));
    } else {
      const overLead = leads.find((item) => String(item.id) === overId);
      targetEtapaId = overLead?.etapaId;
    }
    const lead = leads.find((item) => item.id === leadId);
    if (!lead || !targetEtapaId || lead.etapaId === targetEtapaId) return;

    const targetEtapa = etapas.find((item) => item.id === targetEtapaId);
    if (targetEtapa?.tipo === "PERDIDO") {
      setLossDialog({ leadId, etapaId: targetEtapaId });
      setMotivoPerda("");
      return;
    }

    setLeads((current) => current.map((item) => (
      item.id === leadId ? { ...item, etapaId: targetEtapaId } : item
    )));
    await moveLead(leadId, targetEtapaId);
  };

  const confirmLoss = async () => {
    if (!motivoPerda.trim()) {
      toast.error("Informe o motivo da perda.");
      return;
    }
    setBusy(true);
    try {
      await moveLead(lossDialog.leadId, lossDialog.etapaId, motivoPerda.trim());
      setLossDialog(null);
    } finally {
      setBusy(false);
    }
  };

  const saveComment = async () => {
    if (!comment.trim()) return;
    try {
      await api.post(`/leads/${selectedId}/comentarios`, { conteudo: comment.trim() });
      setComment("");
      toast.success("Comentário adicionado.");
      loadDetail(selectedId);
      load();
    } catch (error) {
      toast.error(error.response?.data?.erro || "Erro ao comentar.");
    }
  };

  const uploadFiles = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const formData = new FormData();
    files.forEach((file) => formData.append("anexos", file));
    try {
      await api.post(`/leads/${selectedId}/anexos`, formData);
      toast.success("Anexo(s) enviados.");
      loadDetail(selectedId);
      load();
    } catch (error) {
      toast.error(error.response?.data?.erro || "Erro ao enviar anexos.");
    }
    event.target.value = "";
  };

  const createTask = async () => {
    if (!taskTitle.trim()) return;
    try {
      await api.post(`/leads/${selectedId}/tarefas`, { titulo: taskTitle.trim() });
      setTaskTitle("");
      toast.success("Tarefa vinculada.");
      loadDetail(selectedId);
      load();
    } catch (error) {
      toast.error(error.response?.data?.erro || "Erro ao criar tarefa.");
    }
  };

  const createAgenda = async () => {
    try {
      await api.post(`/leads/${selectedId}/agenda`, {
        ...agendaForm,
        dataInicio: agendaForm.dataInicio ? new Date(agendaForm.dataInicio).toISOString() : null,
        dataFim: agendaForm.dataFim ? new Date(agendaForm.dataFim).toISOString() : null,
      });
      setAgendaForm({ titulo: "", tipo: "VISITA", dataInicio: "", dataFim: "" });
      toast.success("Compromisso agendado.");
      loadDetail(selectedId);
      load();
    } catch (error) {
      toast.error(error.response?.data?.erro || "Erro ao agendar.");
    }
  };

  const saveEtapa = async () => {
    try {
      await api.post("/leads/etapas", {
        ...etapaForm,
        probabilidadePadrao: Number(etapaForm.probabilidadePadrao),
      });
      toast.success("Etapa criada.");
      setEtapaFormOpen(false);
      load();
    } catch (error) {
      toast.error(error.response?.data?.erro || "Erro ao criar etapa.");
    }
  };

  const updateDetailField = async (payload) => {
    try {
      await api.patch(`/leads/${selectedId}`, {
        nome: payload.titulo || payload.nome,
        propertyId: payload.imovelId ? Number(payload.imovelId) : null,
        assignedUserId: payload.corretorId ? Number(payload.corretorId) : null,
        observacoes: payload.observacoes || payload.notas || null,
        origem: payload.origem || undefined,
      });
      loadDetail(selectedId);
      load();
    } catch (error) {
      toast.error(error.response?.data?.erro || "Erro ao atualizar.");
    }
  };

  const resumo = dashboard?.resumo;
  const maxFunil = Math.max(...(dashboard?.funil || []).map((item) => item.quantidade), 1);

  return (
    <MainLayout title="Pipeline CRM">
      <Stack spacing={3}>
        <Stack direction={{ xs: "column", lg: "row" }} justifyContent="space-between" gap={2}>
          <Box>
            <Typography variant="h5" fontWeight={850}>Pipeline comercial</Typography>
            <Typography color="text.secondary">
              Acompanhe oportunidades da prospecção ao fechamento com previsibilidade para a imobiliária.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.25} flexWrap="wrap" useFlexGap>
            {canManageStages && (
              <Button variant="outlined" onClick={() => setEtapaFormOpen(true)}>Nova etapa</Button>
            )}
            <Button variant="contained" size="large" startIcon={<Add />} onClick={openCreate}>
              Nova oportunidade
            </Button>
          </Stack>
        </Stack>

        <Grid container spacing={2}>
          {[
            { label: "Em aberto", value: resumo?.abertos ?? "—" },
            { label: "Valor no funil", value: formatCurrency(resumo?.valorPipeline) },
            { label: "Valor ponderado", value: formatCurrency(resumo?.valorPonderado) },
            { label: "Conversão", value: resumo ? `${resumo.conversao}%` : "—" },
            { label: "Ganhos", value: formatCurrency(resumo?.valorGanho) },
            { label: "Previsão do mês", value: formatCurrency(resumo?.previsaoMes) },
          ].map((item) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, xl: 2 }} key={item.label}>
              <Card contentSx={{ p: 2 }}>
                <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                <Typography variant="h6" fontWeight={850}>{item.value}</Typography>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Card>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <TrendingUp color="primary" />
            <Typography variant="h6" fontWeight={800}>Funil de conversão</Typography>
          </Stack>
          <Stack spacing={1.25}>
            {(dashboard?.funil || []).map((item) => (
              <Box key={item.etapaId}>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                  <Typography variant="body2" fontWeight={750}>{item.nome}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {item.quantidade} · {formatCurrency(item.valor)}
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={(item.quantidade / maxFunil) * 100}
                  sx={{
                    height: 10,
                    borderRadius: 999,
                    bgcolor: "action.hover",
                    "& .MuiLinearProgress-bar": { bgcolor: item.cor, borderRadius: 999 },
                  }}
                />
              </Box>
            ))}
          </Stack>
        </Card>

        <Card contentSx={{ p: { xs: 2, md: 2.25 } }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            <Input
              size="small"
              placeholder="Pesquisar oportunidades, origem ou notas"
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
              Filtros
            </Button>
          </Stack>
          <Collapse in={filtersOpen}>
            <Grid container spacing={2} sx={{ pt: 2.5 }}>
              <Grid size={{ xs: 12, md: 3 }}>
                <Select size="small" label="Corretor" value={filters.corretorId} options={[{ value: "", label: "Todos" }, ...(options.corretores || []).map((item) => ({ value: item.id, label: item.nome }))]} onChange={(event) => setFilters((current) => ({ ...current, corretorId: event.target.value }))} />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Select size="small" label="Cliente" value={filters.clienteId} options={[{ value: "", label: "Todos" }, ...(options.clientes || []).map((item) => ({ value: item.id, label: item.nome }))]} onChange={(event) => setFilters((current) => ({ ...current, clienteId: event.target.value }))} />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Select size="small" label="Imóvel" value={filters.imovelId} options={[{ value: "", label: "Todos" }, ...(options.imoveis || []).map((item) => ({ value: item.id, label: `${item.codigo} — ${item.titulo}` }))]} onChange={(event) => setFilters((current) => ({ ...current, imovelId: event.target.value }))} />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Input size="small" label="Origem" value={filters.origem} onChange={(event) => setFilters((current) => ({ ...current, origem: event.target.value }))} />
              </Grid>
            </Grid>
          </Collapse>
        </Card>

        {loading ? (
          <Loading variant="skeleton" rows={6} />
        ) : etapas.length === 0 ? (
          <EmptyState title="Pipeline sem etapas" description="Crie etapas para organizar o funil comercial." actionLabel="Criar etapa" onAction={() => setEtapaFormOpen(true)} />
        ) : (
          <Box sx={{ overflowX: "auto", pb: 1 }}>
            <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragEnd={onDragEnd}>
              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                {etapas.map((etapa) => (
                  <EtapaColumn
                    key={etapa.id}
                    etapa={etapa}
                    leads={leadsByEtapa[etapa.id] || []}
                    onOpen={(lead) => setSelectedId(lead.id)}
                  />
                ))}
              </Stack>
              <DragOverlay>
                {activeLead ? <LeadCardContent lead={activeLead} overlay /> : null}
              </DragOverlay>
            </DndContext>
          </Box>
        )}
      </Stack>

      <Drawer
        anchor="right"
        open={Boolean(selectedId)}
        onClose={() => { setSelectedId(null); setDetail(null); }}
        PaperProps={{ sx: { width: { xs: "100%", sm: 480, md: 560 }, p: 0 } }}
      >
        {detailLoading || !detail ? (
          <Box sx={{ p: 3 }}><Loading variant="skeleton" rows={8} /></Box>
        ) : (
          <Box sx={{ p: 3 }}>
            <Stack spacing={2.5}>
              <Box>
                <Chip size="small" label={detail.etapa?.nome || detail.status} sx={{ bgcolor: detail.etapa?.cor || "primary.main", color: "#fff", fontWeight: 750, mb: 1 }} />
                <Typography variant="h5" fontWeight={900}>{detail.titulo}</Typography>
                <Typography color="text.secondary">
                  {detail.corretor?.nome || "Sem corretor"} · {detail.cliente?.nome || "Sem cliente"}
                </Typography>
              </Box>

              <Grid container spacing={1.5}>
                <Grid size={6}><Typography variant="caption" color="text.secondary">Valor previsto</Typography><Typography fontWeight={800}>{formatCurrency(detail.valorPrevisto ?? detail.valor)}</Typography></Grid>
                <Grid size={6}><Typography variant="caption" color="text.secondary">Probabilidade</Typography><Typography fontWeight={800}>{probabilidadeLabel(detail.probabilidade)}</Typography></Grid>
                <Grid size={6}><Typography variant="caption" color="text.secondary">Previsão</Typography><Typography fontWeight={800}>{detail.previsaoFechamento ? formatDateTime(detail.previsaoFechamento) : "—"}</Typography></Grid>
                <Grid size={6}><Typography variant="caption" color="text.secondary">Origem</Typography><Typography fontWeight={800}>{detail.origem || "—"}</Typography></Grid>
                {detail.imovel && (
                  <Grid size={12}><Typography variant="caption" color="text.secondary">Imóvel</Typography><Typography fontWeight={800}>{detail.imovel.codigo} — {detail.imovel.titulo}</Typography></Grid>
                )}
                {detail.motivoPerda && (
                  <Grid size={12}><Typography variant="caption" color="text.secondary">Motivo da perda</Typography><Typography fontWeight={800}>{detail.motivoPerda}</Typography></Grid>
                )}
              </Grid>

              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Select
                  size="small"
                  label="Mover para"
                  value={detail.etapaId || ""}
                  options={etapas.map((item) => ({ value: item.id, label: item.nome }))}
                  onChange={(event) => {
                    const etapa = etapas.find((item) => item.id === Number(event.target.value));
                    if (etapa?.tipo === "PERDIDO") {
                      setLossDialog({ leadId: detail.id, etapaId: etapa.id });
                      return;
                    }
                    moveLead(detail.id, event.target.value);
                  }}
                  sx={{ minWidth: 180 }}
                />
                <Input
                  size="small"
                  type="number"
                  label="Prob %"
                  value={detail.probabilidade}
                  onChange={(event) => setDetail((current) => ({ ...current, probabilidade: event.target.value }))}
                  onBlur={() => updateDetailField({ probabilidade: Number(detail.probabilidade) })}
                  sx={{ width: 100 }}
                />
              </Stack>

              <Card contentSx={{ p: 2 }}>
                <Typography fontWeight={800} sx={{ mb: 1 }}>Comentários</Typography>
                <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
                  <Input size="small" placeholder="Escreva um comentário" value={comment} onChange={(event) => setComment(event.target.value)} sx={{ flex: 1 }} />
                  <Button variant="contained" onClick={saveComment}>Enviar</Button>
                </Stack>
                <Stack spacing={1}>
                  {(detail.comentarios || []).map((item) => (
                    <Box key={item.id} sx={{ p: 1.25, borderRadius: 2, bgcolor: "action.hover" }}>
                      <Typography variant="body2">{item.conteudo}</Typography>
                      <Typography variant="caption" color="text.secondary">{item.usuario?.nome} · {formatDateTime(item.createdAt)}</Typography>
                    </Box>
                  ))}
                </Stack>
              </Card>

              <Card contentSx={{ p: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography fontWeight={800}>Anexos</Typography>
                  <Button component="label" size="small" startIcon={<AttachFileOutlined />}>
                    Enviar
                    <input hidden type="file" multiple onChange={uploadFiles} />
                  </Button>
                </Stack>
                {(detail.anexos || []).map((item) => (
                  <Typography key={item.id} variant="body2" sx={{ mb: 0.75 }}>{item.nome}</Typography>
                ))}
                {(detail.anexos || []).length === 0 && <Typography color="text.secondary" variant="body2">Nenhum anexo.</Typography>}
              </Card>

              <Card contentSx={{ p: 2 }}>
                <Typography fontWeight={800} sx={{ mb: 1 }}>Tarefa vinculada</Typography>
                <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
                  <Input size="small" placeholder="Nova tarefa" value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} sx={{ flex: 1 }} />
                  <Button variant="outlined" onClick={createTask}>Criar</Button>
                </Stack>
                {(detail.tarefas || []).map((item) => (
                  <Typography key={item.id} variant="body2" sx={{ mb: 0.5 }}>{item.titulo} · {item.status}</Typography>
                ))}
              </Card>

              <Card contentSx={{ p: 2 }}>
                <Typography fontWeight={800} sx={{ mb: 1 }}>Agendar</Typography>
                <Grid container spacing={1}>
                  <Grid size={12}><Input size="small" label="Título" value={agendaForm.titulo} onChange={(event) => setAgendaForm((current) => ({ ...current, titulo: event.target.value }))} /></Grid>
                  <Grid size={6}><Select size="small" label="Tipo" value={agendaForm.tipo} options={[{ value: "VISITA", label: "Visita" }, { value: "REUNIAO", label: "Reunião" }, { value: "LIGACAO", label: "Ligação" }, { value: "TAREFA", label: "Tarefa" }]} onChange={(event) => setAgendaForm((current) => ({ ...current, tipo: event.target.value }))} /></Grid>
                  <Grid size={6}><Input size="small" type="datetime-local" label="Início" slotProps={{ inputLabel: { shrink: true } }} value={agendaForm.dataInicio} onChange={(event) => setAgendaForm((current) => ({ ...current, dataInicio: event.target.value }))} /></Grid>
                  <Grid size={12}><Button variant="contained" fullWidth onClick={createAgenda}>Criar na agenda</Button></Grid>
                </Grid>
                <Stack spacing={0.75} sx={{ mt: 1.5 }}>
                  {(detail.eventosAgenda || []).map((item) => (
                    <Typography key={item.id} variant="body2">{item.titulo} · {formatDateTime(item.dataInicio)}</Typography>
                  ))}
                </Stack>
              </Card>

              <Card contentSx={{ p: 2 }}>
                <Typography fontWeight={800} sx={{ mb: 1 }}>Timeline</Typography>
                <Stack spacing={1}>
                  {(detail.historico || []).map((item) => (
                    <Box key={item.id}>
                      <Typography fontWeight={750}>{HISTORY_LABELS[item.acao] || item.acao}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.usuario?.nome} · {formatDateTime(item.createdAt)}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Card>
            </Stack>
          </Box>
        )}
      </Drawer>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="Nova oportunidade"
        maxWidth="md"
        actions={(
          <>
            <Button color="inherit" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button variant="contained" loading={saving} onClick={saveLead}>Salvar</Button>
          </>
        )}
      >
        <Grid container spacing={2} sx={{ pt: 1 }}>
          <Grid size={{ xs: 12, md: 8 }}><Input label="Título" value={form.titulo} onChange={(event) => setForm((current) => ({ ...current, titulo: event.target.value }))} /></Grid>
          <Grid size={{ xs: 12, md: 4 }}><Select label="Etapa" value={form.etapaId} options={etapas.map((item) => ({ value: item.id, label: item.nome }))} onChange={(event) => setForm((current) => ({ ...current, etapaId: event.target.value }))} /></Grid>
          <Grid size={{ xs: 12, md: 4 }}><Select label="Cliente" value={form.clienteId} options={[{ value: "", label: "Sem cliente" }, ...(options.clientes || []).map((item) => ({ value: item.id, label: item.nome }))]} onChange={(event) => setForm((current) => ({ ...current, clienteId: event.target.value }))} /></Grid>
          <Grid size={{ xs: 12, md: 4 }}><Select label="Imóvel" value={form.imovelId} options={[{ value: "", label: "Sem imóvel" }, ...(options.imoveis || []).map((item) => ({ value: item.id, label: `${item.codigo} — ${item.titulo}` }))]} onChange={(event) => setForm((current) => ({ ...current, imovelId: event.target.value }))} /></Grid>
          <Grid size={{ xs: 12, md: 4 }}><Select label="Corretor" value={form.corretorId} options={[{ value: "", label: "Selecionar" }, ...(options.corretores || []).map((item) => ({ value: item.id, label: item.nome }))]} onChange={(event) => setForm((current) => ({ ...current, corretorId: event.target.value }))} /></Grid>
          <Grid size={{ xs: 6, md: 3 }}><Input type="number" label="Valor" value={form.valor} onChange={(event) => setForm((current) => ({ ...current, valor: event.target.value }))} /></Grid>
          <Grid size={{ xs: 6, md: 3 }}><Input type="number" label="Valor previsto" value={form.valorPrevisto} onChange={(event) => setForm((current) => ({ ...current, valorPrevisto: event.target.value }))} /></Grid>
          <Grid size={{ xs: 6, md: 3 }}><Input type="number" label="Probabilidade %" value={form.probabilidade} onChange={(event) => setForm((current) => ({ ...current, probabilidade: event.target.value }))} /></Grid>
          <Grid size={{ xs: 6, md: 3 }}><Input type="date" label="Previsão fechamento" slotProps={{ inputLabel: { shrink: true } }} value={form.previsaoFechamento} onChange={(event) => setForm((current) => ({ ...current, previsaoFechamento: event.target.value }))} /></Grid>
          <Grid size={{ xs: 12, md: 6 }}><Input label="Origem" value={form.origem} onChange={(event) => setForm((current) => ({ ...current, origem: event.target.value }))} /></Grid>
          <Grid size={{ xs: 12 }}><Input multiline rows={3} label="Notas" value={form.notas} onChange={(event) => setForm((current) => ({ ...current, notas: event.target.value }))} /></Grid>
        </Grid>
      </Modal>

      <Modal
        open={etapaFormOpen}
        onClose={() => setEtapaFormOpen(false)}
        title="Nova etapa do funil"
        actions={(
          <>
            <Button color="inherit" onClick={() => setEtapaFormOpen(false)}>Cancelar</Button>
            <Button variant="contained" onClick={saveEtapa}>Salvar etapa</Button>
          </>
        )}
      >
        <Grid container spacing={2} sx={{ pt: 1 }}>
          <Grid size={12}><Input label="Nome" value={etapaForm.nome} onChange={(event) => setEtapaForm((current) => ({ ...current, nome: event.target.value }))} /></Grid>
          <Grid size={12}><Input label="Código" value={etapaForm.codigo} onChange={(event) => setEtapaForm((current) => ({ ...current, codigo: event.target.value }))} helperText="Ex.: QUALIFICACAO" /></Grid>
          <Grid size={6}><Input label="Cor" value={etapaForm.cor} onChange={(event) => setEtapaForm((current) => ({ ...current, cor: event.target.value }))} /></Grid>
          <Grid size={6}><Select label="Tipo" value={etapaForm.tipo} options={[{ value: "ABERTA", label: "Aberta" }, { value: "GANHO", label: "Ganho" }, { value: "PERDIDO", label: "Perdido" }]} onChange={(event) => setEtapaForm((current) => ({ ...current, tipo: event.target.value }))} /></Grid>
          <Grid size={12}><Input type="number" label="Probabilidade padrão" value={etapaForm.probabilidadePadrao} onChange={(event) => setEtapaForm((current) => ({ ...current, probabilidadePadrao: event.target.value }))} /></Grid>
        </Grid>
      </Modal>

      <Modal
        open={Boolean(lossDialog)}
        onClose={() => setLossDialog(null)}
        title="Motivo da perda"
        actions={(
          <>
            <Button color="inherit" onClick={() => setLossDialog(null)}>Voltar</Button>
            <Button color="error" variant="contained" loading={busy} onClick={confirmLoss}>Mover para perdido</Button>
          </>
        )}
      >
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Registre por que a oportunidade foi perdida — isso melhora o aprendizado do funil.
        </Typography>
        <Select
          label="Motivo sugerido"
          value={motivoPerda}
          options={[
            { value: "", label: "Selecionar" },
            ...(options.motivosPerda || []).map((item) => ({ value: item, label: item })),
          ]}
          onChange={(event) => setMotivoPerda(event.target.value)}
        />
        <Input
          sx={{ mt: 2 }}
          label="Motivo da perda"
          value={motivoPerda}
          onChange={(event) => setMotivoPerda(event.target.value)}
          helperText="Obrigatório para marcar como perdido"
        />
      </Modal>
    </MainLayout>
  );
}
