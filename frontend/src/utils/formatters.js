export const formatCurrency = (value) => {
  if (value == null) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export const formatDate = (date) => {
  if (!date) return "—";
  return new Intl.DateTimeFormat("pt-BR").format(new Date(date));
};

export const formatDateTime = (date) => {
  if (!date) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date));
};

export const STATUS_IMOVEL = {
  DISPONIVEL: { label: "Disponível", color: "success" },
  RESERVADO: { label: "Reservado", color: "warning" },
  VENDIDO: { label: "Vendido", color: "info" },
  ALUGADO: { label: "Alugado", color: "primary" },
  INATIVO: { label: "Inativo", color: "default" },
};

export const STATUS_LEAD = {
  NOVO: { label: "Aguardando contato", color: "#6366f1" },
  PRIMEIRO_CONTATO: { label: "Primeiro Contato", color: "#8b5cf6" },
  CONTATO: { label: "Contato", color: "#8b5cf6" },
  VISITA_AGENDADA: { label: "Visita Agendada", color: "#a855f7" },
  PROPOSTA: { label: "Proposta", color: "#f59e0b" },
  NEGOCIACAO: { label: "Negociação", color: "#f97316" },
  FECHADO: { label: "Fechado", color: "#22c55e" },
  PERDIDO: { label: "Perdido", color: "#ef4444" },
};

export const STATUS_COBRANCA = {
  PENDENTE: { label: "Pendente", color: "warning" },
  PAGO: { label: "Pago", color: "success" },
  ATRASADO: { label: "Atrasado", color: "error" },
  CANCELADO: { label: "Cancelado", color: "default" },
};

export const TIPO_CLIENTE = {
  PROPRIETARIO: "Proprietário",
  INQUILINO: "Inquilino",
  COMPRADOR: "Comprador",
  LEAD: "Lead",
};

export const TIPO_CONTRATO = {
  ALUGUEL: "Aluguel",
  VENDA: "Venda",
  ADMINISTRACAO: "Administração",
};

export const PRIORIDADE_TAREFA = {
  BAIXA: { label: "Baixa", color: "default" },
  MEDIA: { label: "Média", color: "info" },
  ALTA: { label: "Alta", color: "warning" },
  URGENTE: { label: "Urgente", color: "error" },
};
