export const TIPOS_EVENTO = [
  { value: "VISITA", label: "Visita", color: "#2563eb" },
  { value: "REUNIAO", label: "Reunião", color: "#0f766e" },
  { value: "LIGACAO", label: "Ligação", color: "#d97706" },
  { value: "TAREFA", label: "Tarefa", color: "#7c3aed" },
];

export const STATUS_EVENTO = [
  { value: "AGENDADO", label: "Agendado", color: "info" },
  { value: "CONFIRMADO", label: "Confirmado", color: "primary" },
  { value: "CONCLUIDO", label: "Concluído", color: "success" },
  { value: "CANCELADO", label: "Cancelado", color: "default" },
];

export const REPETICOES_EVENTO = [
  { value: "NENHUMA", label: "Sem repetição" },
  { value: "DIARIA", label: "Diária" },
  { value: "SEMANAL", label: "Semanal" },
  { value: "QUINZENAL", label: "Quinzenal" },
  { value: "MENSAL", label: "Mensal" },
];

export const LEMBRETES_EVENTO = [
  { value: "", label: "Sem lembrete" },
  { value: 0, label: "No horário" },
  { value: 5, label: "5 minutos antes" },
  { value: 10, label: "10 minutos antes" },
  { value: 15, label: "15 minutos antes" },
  { value: 30, label: "30 minutos antes" },
  { value: 60, label: "1 hora antes" },
  { value: 120, label: "2 horas antes" },
  { value: 1440, label: "1 dia antes" },
];

export const HISTORY_LABELS = {
  CRIADO: "Compromisso criado",
  ATUALIZADO: "Compromisso atualizado",
  REAGENDADO: "Reagendado",
  CONFIRMADO: "Confirmado",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
  LEMBRETE_ENVIADO: "Lembrete disparado",
};

export function optionLabel(options, value) {
  return options.find((item) => String(item.value) === String(value))?.label || value || "—";
}

export function tipoMeta(value) {
  return TIPOS_EVENTO.find((item) => item.value === value) || { label: value, color: "#64748b" };
}

export function statusMeta(value) {
  return STATUS_EVENTO.find((item) => item.value === value) || { label: value, color: "default" };
}

export function toLocalInputValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function toIsoFromLocal(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function eventToCalendar(evento) {
  const tipo = tipoMeta(evento.tipo);
  const canceled = evento.status === "CANCELADO";
  const done = evento.status === "CONCLUIDO";
  return {
    id: String(evento.id),
    title: evento.titulo,
    start: evento.dataInicio,
    end: evento.dataFim,
    allDay: Boolean(evento.diaInteiro),
    backgroundColor: canceled ? "#94a3b8" : done ? "#16a34a" : tipo.color,
    borderColor: canceled ? "#94a3b8" : done ? "#16a34a" : tipo.color,
    editable: !canceled && !done,
    extendedProps: { raw: evento },
  };
}
