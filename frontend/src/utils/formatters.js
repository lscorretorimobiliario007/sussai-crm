export const formatCurrency = (value) => {
  if (value == null || value === "") return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value));
};

export const formatDate = (date) => {
  if (!date) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(date));
};

export const formatDateTime = (date) => {
  if (!date) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date));
};

export const STATUS_LEAD = {
  NOVO: { label: "Novo", color: "#6366f1" },
  PRIMEIRO_CONTATO: { label: "Primeiro contato", color: "#8b5cf6" },
  VISITA_AGENDADA: { label: "Visita", color: "#a855f7" },
  PROPOSTA: { label: "Proposta", color: "#f59e0b" },
  NEGOCIACAO: { label: "Negociação", color: "#f97316" },
  FECHADO: { label: "Fechado", color: "#22c55e" },
  PERDIDO: { label: "Perdido", color: "#ef4444" },
};

export const PRIORIDADE_TAREFA = {
  BAIXA: { label: "Baixa", color: "default" },
  MEDIA: { label: "Média", color: "info" },
  ALTA: { label: "Alta", color: "warning" },
  URGENTE: { label: "Urgente", color: "error" },
};

export const TIPO_CONTRATO = {
  ALUGUEL: { label: "Aluguel", color: "info" },
  VENDA: { label: "Venda", color: "success" },
  ADMINISTRACAO: { label: "Administração", color: "secondary" },
};
