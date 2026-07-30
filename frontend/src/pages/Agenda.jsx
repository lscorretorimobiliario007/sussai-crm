import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Badge,
  Box,
  Chip,
  Collapse,
  FormControlLabel,
  Grid,
  InputAdornment,
  Pagination,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import {
  Add,
  CheckCircleOutlined,
  EventAvailableOutlined,
  FilterAltOutlined,
  NotificationsNoneOutlined,
  Search,
  TimelineOutlined,
  TodayOutlined,
  ViewAgendaOutlined,
} from "@mui/icons-material";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";
import MainLayout from "../components/layout/MainLayout";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import EmptyState from "../components/ui/EmptyState";
import Input from "../components/ui/Input";
import Loading from "../components/ui/Loading";
import Modal from "../components/ui/Modal";
import Select from "../components/ui/Select";
import { useToast } from "../components/ui/Toast";
import api from "../api/axios";
import { formatDateTime } from "../utils/formatters";
import {
  HISTORY_LABELS,
  LEMBRETES_EVENTO,
  REPETICOES_EVENTO,
  STATUS_EVENTO,
  TIPOS_EVENTO,
  eventToCalendar,
  optionLabel,
  statusMeta,
  tipoMeta,
  toIsoFromLocal,
  toLocalInputValue,
} from "../utils/agenda";
import "../components/agenda/agendaCalendar.css";

const emptyForm = {
  titulo: "",
  descricao: "",
  tipo: "VISITA",
  status: "AGENDADO",
  dataInicio: "",
  dataFim: "",
  diaInteiro: false,
  localizacao: "",
  usuarioId: "",
  clienteId: "",
  imovelId: "",
  leadId: "",
  repeticao: "NENHUMA",
  repeticaoAte: "",
  lembreteMinutos: "",
};

const initialFilters = {
  tipo: "",
  status: "",
  usuarioId: "",
  clienteId: "",
  imovelId: "",
};

function defaultRange() {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 2);
  return { start, end };
}

export default function Agenda() {
  const toast = useToast();
  const calendarRef = useRef(null);
  const [viewMode, setViewMode] = useState("dayGridMonth");
  const [events, setEvents] = useState([]);
  const [listEvents, setListEvents] = useState([]);
  const [listMeta, setListMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [listPage, setListPage] = useState(1);
  const [dashboard, setDashboard] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [options, setOptions] = useState({
    corretores: [], clientes: [], imoveis: [], leads: [],
  });
  const [filters, setFilters] = useState(initialFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [range, setRange] = useState(defaultRange);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [selected, setSelected] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [showList, setShowList] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    api.get("/agenda/opcoes")
      .then((response) => setOptions(response.data))
      .catch(() => setOptions({ corretores: [], clientes: [], imoveis: [], leads: [] }));
  }, []);

  const loadDashboard = useCallback(async () => {
    try {
      const response = await api.get("/agenda/dashboard");
      setDashboard(response.data);
    } catch {
      setDashboard(null);
    }
  }, []);

  const loadTimeline = useCallback(async () => {
    try {
      const response = await api.get("/agenda/timeline", { params: { limit: 12 } });
      setTimeline(response.data.data || []);
    } catch {
      setTimeline([]);
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const response = await api.get("/agenda/notificacoes");
      setNotifications(response.data.data || []);
      setUnread(response.data.meta?.naoLidas || 0);
    } catch {
      setNotifications([]);
      setUnread(0);
    }
  }, []);

  const buildParams = useCallback((extra = {}) => {
    const params = {
      ...filters,
      busca: debouncedSearch,
      ...extra,
    };
    Object.keys(params).forEach((key) => {
      if (params[key] === "" || params[key] == null) delete params[key];
    });
    return params;
  }, [debouncedSearch, filters]);

  const loadCalendar = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/agenda", {
        params: buildParams({
          inicio: range.start.toISOString(),
          fim: range.end.toISOString(),
          limit: 500,
          modo: "calendario",
        }),
      });
      setEvents((response.data.data || []).map(eventToCalendar));
    } catch (error) {
      toast.error(error.response?.data?.erro || "Erro ao carregar agenda.");
    } finally {
      setLoading(false);
    }
  }, [buildParams, range.end, range.start, toast]);

  const loadList = useCallback(async () => {
    try {
      const response = await api.get("/agenda", {
        params: buildParams({
          modo: "lista",
          page: listPage,
          limit: 12,
          inicio: range.start.toISOString(),
          fim: range.end.toISOString(),
        }),
      });
      setListEvents(response.data.data || []);
      setListMeta(response.data.meta || { page: 1, totalPages: 1, total: 0 });
    } catch (error) {
      toast.error(error.response?.data?.erro || "Erro ao carregar lista.");
    }
  }, [buildParams, listPage, range.end, range.start, toast]);

  useEffect(() => {
    loadCalendar();
    loadDashboard();
    loadTimeline();
    loadNotifications();
  }, [loadCalendar, loadDashboard, loadNotifications, loadTimeline]);

  useEffect(() => {
    if (showList) loadList();
  }, [loadList, showList]);

  const updateFilter = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value }));
    setListPage(1);
  };

  const openCreate = (start, end) => {
    const startDate = start ? new Date(start) : new Date();
    const endDate = end ? new Date(end) : new Date(startDate.getTime() + 60 * 60 * 1000);
    setEditingId(null);
    setForm({
      ...emptyForm,
      dataInicio: toLocalInputValue(startDate),
      dataFim: toLocalInputValue(endDate),
      usuarioId: options.corretores?.[0]?.id || "",
    });
    setFormOpen(true);
  };

  const openEdit = async (evento) => {
    const raw = evento?.extendedProps?.raw || evento;
    try {
      const response = await api.get(`/agenda/${raw.id}`);
      const data = response.data;
      setSelected(data);
      setEditingId(data.id);
      setForm({
        titulo: data.titulo || "",
        descricao: data.descricao || "",
        tipo: data.tipo,
        status: data.status,
        dataInicio: toLocalInputValue(data.dataInicio),
        dataFim: toLocalInputValue(data.dataFim),
        diaInteiro: Boolean(data.diaInteiro),
        localizacao: data.localizacao || "",
        usuarioId: data.usuarioId || "",
        clienteId: data.clienteId || "",
        imovelId: data.imovelId || "",
        leadId: data.leadId || "",
        repeticao: "NENHUMA",
        repeticaoAte: "",
        lembreteMinutos: data.lembreteMinutos ?? "",
      });
      setFormOpen(true);
    } catch (error) {
      toast.error(error.response?.data?.erro || "Erro ao abrir compromisso.");
    }
  };

  const buildPayload = () => ({
    ...form,
    dataInicio: toIsoFromLocal(form.dataInicio),
    dataFim: toIsoFromLocal(form.dataFim),
    repeticaoAte: form.repeticaoAte ? toIsoFromLocal(`${form.repeticaoAte}T23:59:00`) : null,
    lembreteMinutos: form.lembreteMinutos === "" ? null : Number(form.lembreteMinutos),
    usuarioId: form.usuarioId ? Number(form.usuarioId) : null,
    clienteId: form.clienteId ? Number(form.clienteId) : null,
    imovelId: form.imovelId ? Number(form.imovelId) : null,
    leadId: form.leadId ? Number(form.leadId) : null,
  });

  const save = async () => {
    if (!form.titulo.trim()) {
      toast.error("Informe o título do compromisso.");
      return;
    }
    setSaving(true);
    try {
      const payload = buildPayload();
      if (editingId) {
        await api.put(`/agenda/${editingId}`, payload);
        toast.success("Compromisso atualizado.");
      } else {
        await api.post("/agenda", payload);
        toast.success("Compromisso criado.");
      }
      setFormOpen(false);
      await Promise.all([loadCalendar(), loadDashboard(), loadTimeline(), showList ? loadList() : null]);
    } catch (error) {
      toast.error(error.response?.data?.erro || "Erro ao salvar compromisso.");
    } finally {
      setSaving(false);
    }
  };

  const onEventDrop = async (info) => {
    try {
      await api.patch(`/agenda/${info.event.id}/reagendar`, {
        dataInicio: info.event.start?.toISOString(),
        dataFim: (info.event.end || info.event.start)?.toISOString(),
      });
      toast.success("Compromisso reagendado.");
      loadDashboard();
      loadTimeline();
    } catch (error) {
      info.revert();
      toast.error(error.response?.data?.erro || "Não foi possível reagendar.");
    }
  };

  const onEventResize = async (info) => {
    try {
      await api.patch(`/agenda/${info.event.id}/reagendar`, {
        dataInicio: info.event.start?.toISOString(),
        dataFim: info.event.end?.toISOString(),
      });
      toast.success("Duração atualizada.");
    } catch (error) {
      info.revert();
      toast.error(error.response?.data?.erro || "Não foi possível alterar a duração.");
    }
  };

  const executeConfirm = async () => {
    setBusy(true);
    try {
      if (confirm.type === "concluir") {
        await api.patch(`/agenda/${confirm.id}/concluir`);
        toast.success("Compromisso concluído.");
      } else if (confirm.type === "cancelar") {
        await api.patch(`/agenda/${confirm.id}/cancelar`);
        toast.success("Compromisso cancelado.");
      } else {
        await api.delete(`/agenda/${confirm.id}`);
        toast.success("Compromisso removido.");
      }
      setConfirm(null);
      setFormOpen(false);
      await Promise.all([loadCalendar(), loadDashboard(), loadTimeline(), showList ? loadList() : null]);
    } catch (error) {
      toast.error(error.response?.data?.erro || "Não foi possível concluir a ação.");
    } finally {
      setBusy(false);
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch("/agenda/notificacoes/lidas");
      loadNotifications();
    } catch (error) {
      toast.error(error.response?.data?.erro || "Erro ao marcar notificações.");
    }
  };

  const markOneRead = async (id) => {
    try {
      await api.patch(`/agenda/notificacoes/${id}/lida`);
      loadNotifications();
    } catch {
      /* ignore */
    }
  };

  const changeView = (view) => {
    setViewMode(view);
    setShowList(view === "lista");
    const apiCalendar = calendarRef.current?.getApi?.();
    if (view !== "lista" && apiCalendar) apiCalendar.changeView(view);
  };

  const activeFilterCount = useMemo(() => (
    Object.values(filters).filter(Boolean).length
  ), [filters]);

  const resumo = dashboard?.resumo;

  return (
    <MainLayout title="Agenda">
      <Stack spacing={3}>
        <Stack direction={{ xs: "column", lg: "row" }} justifyContent="space-between" gap={2}>
          <Box>
            <Typography variant="h5" fontWeight={850}>Agenda comercial</Typography>
            <Typography color="text.secondary">
              Visitas, reuniões, ligações e tarefas com reagendamento por arrastar.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.25} flexWrap="wrap" useFlexGap>
            <Badge badgeContent={unread} color="error">
              <Button variant="outlined" startIcon={<NotificationsNoneOutlined />} onClick={() => setNotifOpen(true)}>
                Lembretes
              </Button>
            </Badge>
            <Button variant="contained" size="large" startIcon={<Add />} onClick={() => openCreate()}>
              Novo compromisso
            </Button>
          </Stack>
        </Stack>

        <Grid container spacing={2}>
          {[
            { label: "Hoje", value: resumo?.hoje ?? "—", icon: TodayOutlined },
            { label: "Próximos 7 dias", value: resumo?.semana ?? "—", icon: EventAvailableOutlined },
            { label: "Agendados", value: resumo?.agendados ?? "—", icon: ViewAgendaOutlined },
            { label: "Concluídos", value: resumo?.concluidos ?? "—", icon: CheckCircleOutlined },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={item.label}>
                <Card contentSx={{ p: 2.25 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box sx={{ width: 42, height: 42, borderRadius: 2, bgcolor: "action.hover", color: "primary.main", display: "grid", placeItems: "center" }}>
                      <Icon fontSize="small" />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                      <Typography variant="h5" fontWeight={850}>{item.value}</Typography>
                    </Box>
                  </Stack>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        <Card contentSx={{ p: { xs: 2, md: 2.25 } }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            <Input
              size="small"
              placeholder="Pesquisar por título, descrição ou local"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search /></InputAdornment> } }}
              sx={{ flex: 1 }}
            />
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {[
                { id: "dayGridMonth", label: "Mês" },
                { id: "timeGridWeek", label: "Semana" },
                { id: "timeGridDay", label: "Dia" },
                { id: "lista", label: "Lista" },
              ].map((item) => (
                <Button
                  key={item.id}
                  size="small"
                  variant={viewMode === item.id || (showList && item.id === "lista") ? "contained" : "outlined"}
                  onClick={() => changeView(item.id)}
                >
                  {item.label}
                </Button>
              ))}
              <Button
                color={filtersOpen ? "primary" : "inherit"}
                variant={filtersOpen ? "contained" : "outlined"}
                startIcon={<FilterAltOutlined />}
                onClick={() => setFiltersOpen((current) => !current)}
              >
                Filtros {activeFilterCount > 0 && `(${activeFilterCount})`}
              </Button>
            </Stack>
          </Stack>

          <Collapse in={filtersOpen}>
            <Grid container spacing={2} sx={{ pt: 2.5 }}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Select size="small" label="Tipo" value={filters.tipo} options={[{ value: "", label: "Todos" }, ...TIPOS_EVENTO]} onChange={(event) => updateFilter("tipo", event.target.value)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Select size="small" label="Status" value={filters.status} options={[{ value: "", label: "Todos" }, ...STATUS_EVENTO]} onChange={(event) => updateFilter("status", event.target.value)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Select
                  size="small"
                  label="Corretor"
                  value={filters.usuarioId}
                  options={[{ value: "", label: "Todos" }, ...(options.corretores || []).map((item) => ({ value: item.id, label: item.nome }))]}
                  onChange={(event) => updateFilter("usuarioId", event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Select
                  size="small"
                  label="Cliente"
                  value={filters.clienteId}
                  options={[{ value: "", label: "Todos" }, ...(options.clientes || []).map((item) => ({ value: item.id, label: item.nome }))]}
                  onChange={(event) => updateFilter("clienteId", event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Select
                  size="small"
                  label="Imóvel"
                  value={filters.imovelId}
                  options={[{ value: "", label: "Todos" }, ...(options.imoveis || []).map((item) => ({ value: item.id, label: `${item.codigo} — ${item.titulo}` }))]}
                  onChange={(event) => updateFilter("imovelId", event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Button color="inherit" onClick={() => { setFilters(initialFilters); setSearch(""); }}>Limpar filtros</Button>
              </Grid>
            </Grid>
          </Collapse>
        </Card>

        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, xl: 9 }}>
            <Card contentSx={{ p: { xs: 1.5, md: 2.5 } }}>
              {loading ? <Loading variant="skeleton" rows={8} /> : showList ? (
                listEvents.length === 0 ? (
                  <EmptyState
                    title="Nenhum compromisso na lista"
                    description="Crie um compromisso ou ajuste os filtros."
                    actionLabel="Novo compromisso"
                    onAction={() => openCreate()}
                  />
                ) : (
                  <Stack spacing={1.5}>
                    {listEvents.map((evento) => {
                      const tipo = tipoMeta(evento.tipo);
                      const status = statusMeta(evento.status);
                      return (
                        <Box
                          key={evento.id}
                          onClick={() => openEdit(evento)}
                          sx={{
                            p: 2,
                            borderRadius: 2.5,
                            border: 1,
                            borderColor: "divider",
                            cursor: "pointer",
                            transition: "transform .16s ease, box-shadow .16s ease",
                            "&:hover": { transform: "translateY(-2px)", boxShadow: 4 },
                          }}
                        >
                          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1}>
                            <Box>
                              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 0.75 }}>
                                <Chip size="small" label={tipo.label} sx={{ bgcolor: tipo.color, color: "#fff", fontWeight: 750 }} />
                                <Chip size="small" label={status.label} color={status.color} />
                              </Stack>
                              <Typography fontWeight={850}>{evento.titulo}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {formatDateTime(evento.dataInicio)} — {formatDateTime(evento.dataFim)}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {evento.usuario?.nome || "Sem corretor"}
                                {evento.cliente ? ` · ${evento.cliente.nome}` : ""}
                                {evento.imovel ? ` · ${evento.imovel.codigo}` : ""}
                              </Typography>
                            </Box>
                            <Stack direction="row" spacing={1}>
                              {evento.status !== "CONCLUIDO" && evento.status !== "CANCELADO" && (
                                <Button size="small" onClick={(event) => { event.stopPropagation(); setConfirm({ type: "concluir", id: evento.id }); }}>Concluir</Button>
                              )}
                              {evento.status !== "CANCELADO" && (
                                <Button size="small" color="error" onClick={(event) => { event.stopPropagation(); setConfirm({ type: "cancelar", id: evento.id }); }}>Cancelar</Button>
                              )}
                            </Stack>
                          </Stack>
                        </Box>
                      );
                    })}
                    {listMeta.totalPages > 1 && (
                      <Stack alignItems="center" sx={{ pt: 1 }}>
                        <Pagination page={listPage} count={listMeta.totalPages} color="primary" onChange={(event, value) => setListPage(value)} />
                      </Stack>
                    )}
                  </Stack>
                )
              ) : (
                <Box className="sussai-agenda-calendar">
                  <FullCalendar
                    ref={calendarRef}
                    plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                    initialView={viewMode === "lista" ? "dayGridMonth" : viewMode}
                    headerToolbar={{
                      left: "prev,next today",
                      center: "title",
                      right: "",
                    }}
                    locale={ptBrLocale}
                    buttonText={{ today: "Hoje", month: "Mês", week: "Semana", day: "Dia", list: "Lista" }}
                    height="auto"
                    editable
                    droppable
                    selectable
                    selectMirror
                    dayMaxEvents={3}
                    events={events}
                    select={(info) => openCreate(info.start, info.end)}
                    eventClick={(info) => openEdit(info.event)}
                    eventDrop={onEventDrop}
                    eventResize={onEventResize}
                    datesSet={(info) => {
                      setRange({ start: info.start, end: info.end });
                    }}
                  />
                </Box>
              )}
            </Card>
          </Grid>

          <Grid size={{ xs: 12, xl: 3 }}>
            <Stack spacing={2.5}>
              <Card>
                <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>Próximos</Typography>
                <Stack spacing={1.25}>
                  {(dashboard?.proximos || []).length === 0 && (
                    <Typography color="text.secondary" variant="body2">Nenhum compromisso futuro.</Typography>
                  )}
                  {(dashboard?.proximos || []).map((evento) => (
                    <Box key={evento.id} sx={{ cursor: "pointer" }} onClick={() => openEdit(evento)}>
                      <Typography fontWeight={750} noWrap>{evento.titulo}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {optionLabel(TIPOS_EVENTO, evento.tipo)} · {formatDateTime(evento.dataInicio)}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Card>

              <Card>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                  <TimelineOutlined fontSize="small" color="primary" />
                  <Typography variant="h6" fontWeight={800}>Timeline</Typography>
                </Stack>
                <Stack spacing={1.25}>
                  {timeline.length === 0 && (
                    <Typography color="text.secondary" variant="body2">Sem atividades recentes.</Typography>
                  )}
                  {timeline.map((item) => (
                    <Box key={item.id}>
                      <Typography fontWeight={750}>{HISTORY_LABELS[item.acao] || item.acao}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.evento?.titulo} · {item.usuario?.nome} · {formatDateTime(item.createdAt)}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Card>

              <Card>
                <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>Tipos ativos</Typography>
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  {TIPOS_EVENTO.map((tipo) => (
                    <Chip
                      key={tipo.value}
                      label={`${tipo.label}: ${resumo?.porTipo?.[tipo.value] || 0}`}
                      sx={{ bgcolor: `${tipo.color}22`, color: tipo.color, fontWeight: 750 }}
                    />
                  ))}
                </Stack>
              </Card>
            </Stack>
          </Grid>
        </Grid>
      </Stack>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingId ? "Editar compromisso" : "Novo compromisso"}
        maxWidth="md"
        actions={(
          <>
            {editingId && selected?.status !== "CANCELADO" && (
              <>
                {selected?.status !== "CONCLUIDO" && (
                  <Button color="success" onClick={() => setConfirm({ type: "concluir", id: editingId })}>Concluir</Button>
                )}
                <Button color="error" onClick={() => setConfirm({ type: "cancelar", id: editingId })}>Cancelar</Button>
              </>
            )}
            <Button color="inherit" onClick={() => setFormOpen(false)}>Fechar</Button>
            <Button variant="contained" loading={saving} onClick={save}>Salvar</Button>
          </>
        )}
      >
        <Grid container spacing={2} sx={{ pt: 1 }}>
          <Grid size={{ xs: 12, md: 8 }}><Input label="Título" value={form.titulo} onChange={(event) => setForm((current) => ({ ...current, titulo: event.target.value }))} /></Grid>
          <Grid size={{ xs: 12, md: 4 }}><Select label="Tipo" value={form.tipo} options={TIPOS_EVENTO} onChange={(event) => setForm((current) => ({ ...current, tipo: event.target.value }))} /></Grid>
          <Grid size={{ xs: 12, md: 6 }}><Input type="datetime-local" label="Início" slotProps={{ inputLabel: { shrink: true } }} value={form.dataInicio} onChange={(event) => setForm((current) => ({ ...current, dataInicio: event.target.value }))} /></Grid>
          <Grid size={{ xs: 12, md: 6 }}><Input type="datetime-local" label="Fim" slotProps={{ inputLabel: { shrink: true } }} value={form.dataFim} onChange={(event) => setForm((current) => ({ ...current, dataFim: event.target.value }))} /></Grid>
          <Grid size={{ xs: 12, md: 4 }}><Select label="Corretor" value={form.usuarioId} options={[{ value: "", label: "Selecionar" }, ...(options.corretores || []).map((item) => ({ value: item.id, label: item.nome }))]} onChange={(event) => setForm((current) => ({ ...current, usuarioId: event.target.value }))} /></Grid>
          <Grid size={{ xs: 12, md: 4 }}><Select label="Cliente" value={form.clienteId} options={[{ value: "", label: "Sem cliente" }, ...(options.clientes || []).map((item) => ({ value: item.id, label: item.nome }))]} onChange={(event) => setForm((current) => ({ ...current, clienteId: event.target.value }))} /></Grid>
          <Grid size={{ xs: 12, md: 4 }}><Select label="Imóvel" value={form.imovelId} options={[{ value: "", label: "Sem imóvel" }, ...(options.imoveis || []).map((item) => ({ value: item.id, label: `${item.codigo} — ${item.titulo}` }))]} onChange={(event) => setForm((current) => ({ ...current, imovelId: event.target.value }))} /></Grid>
          <Grid size={{ xs: 12, md: 6 }}><Select label="Lead" value={form.leadId} options={[{ value: "", label: "Sem lead" }, ...(options.leads || []).map((item) => ({ value: item.id, label: item.titulo }))]} onChange={(event) => setForm((current) => ({ ...current, leadId: event.target.value }))} /></Grid>
          <Grid size={{ xs: 12, md: 6 }}><Input label="Local" value={form.localizacao} onChange={(event) => setForm((current) => ({ ...current, localizacao: event.target.value }))} /></Grid>
          {!editingId && (
            <>
              <Grid size={{ xs: 12, md: 6 }}><Select label="Repetição" value={form.repeticao} options={REPETICOES_EVENTO} onChange={(event) => setForm((current) => ({ ...current, repeticao: event.target.value }))} /></Grid>
              <Grid size={{ xs: 12, md: 6 }}><Input type="date" label="Repetir até" slotProps={{ inputLabel: { shrink: true } }} value={form.repeticaoAte} onChange={(event) => setForm((current) => ({ ...current, repeticaoAte: event.target.value }))} disabled={form.repeticao === "NENHUMA"} /></Grid>
            </>
          )}
          <Grid size={{ xs: 12, md: 6 }}><Select label="Lembrete" value={form.lembreteMinutos} options={LEMBRETES_EVENTO} onChange={(event) => setForm((current) => ({ ...current, lembreteMinutos: event.target.value }))} /></Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControlLabel
              control={<Switch checked={form.diaInteiro} onChange={(event) => setForm((current) => ({ ...current, diaInteiro: event.target.checked }))} />}
              label="Dia inteiro"
            />
          </Grid>
          <Grid size={{ xs: 12 }}><Input multiline rows={3} label="Descrição" value={form.descricao} onChange={(event) => setForm((current) => ({ ...current, descricao: event.target.value }))} /></Grid>
        </Grid>
      </Modal>

      <Modal
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        title="Lembretes e notificações"
        maxWidth="sm"
        actions={(
          <>
            <Button color="inherit" onClick={markAllRead}>Marcar todas como lidas</Button>
            <Button variant="contained" onClick={() => setNotifOpen(false)}>Fechar</Button>
          </>
        )}
      >
        <Stack spacing={1.5}>
          {notifications.length === 0 && <Typography color="text.secondary">Nenhuma notificação.</Typography>}
          {notifications.map((item) => (
            <Box
              key={item.id}
              sx={{ p: 1.5, borderRadius: 2, bgcolor: item.lida ? "transparent" : "action.hover", border: 1, borderColor: "divider", cursor: "pointer" }}
              onClick={() => markOneRead(item.id)}
            >
              <Typography fontWeight={800}>{item.titulo}</Typography>
              <Typography variant="body2" color="text.secondary">{item.mensagem}</Typography>
              <Typography variant="caption" color="text.secondary">{formatDateTime(item.createdAt)}</Typography>
            </Box>
          ))}
        </Stack>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={executeConfirm}
        loading={busy}
        title={confirm?.type === "concluir" ? "Concluir compromisso" : confirm?.type === "cancelar" ? "Cancelar compromisso" : "Remover compromisso"}
        description="Esta ação atualiza o status do compromisso na agenda."
        confirmLabel={confirm?.type === "concluir" ? "Concluir" : confirm?.type === "cancelar" ? "Cancelar compromisso" : "Remover"}
      />
    </MainLayout>
  );
}
