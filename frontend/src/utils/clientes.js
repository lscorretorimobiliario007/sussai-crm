export function formatPhone(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
  return digits
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

export function formatCpf(value) {
  return String(value || "")
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

export function formatCnpj(value) {
  return String(value || "")
    .replace(/\D/g, "")
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export function formatCpfCnpj(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length > 11) return formatCnpj(digits);
  return formatCpf(digits);
}

export function optionLabel(options, value) {
  if (Array.isArray(options)) {
    return options.find((item) => String(item.value) === String(value))?.label || value || "—";
  }
  return options?.[value]?.label || value || "—";
}

export const TIPOS_CLIENTE = [
  { value: "PROPRIETARIO", label: "Proprietário" },
  { value: "INQUILINO", label: "Inquilino" },
  { value: "COMPRADOR", label: "Comprador" },
  { value: "LEAD", label: "Lead" },
];

export const TIPOS_PESSOA = [
  { value: "PF", label: "Pessoa física" },
  { value: "PJ", label: "Pessoa jurídica" },
];

export const STATUS_CLIENTE_CRM = [
  { value: "PROSPECTO", label: "Prospecto", color: "default" },
  { value: "QUALIFICADO", label: "Qualificado", color: "info" },
  { value: "NEGOCIACAO", label: "Negociação", color: "warning" },
  { value: "CLIENTE", label: "Cliente", color: "success" },
  { value: "INATIVO", label: "Inativo", color: "default" },
  { value: "PERDIDO", label: "Perdido", color: "error" },
];

export const INTERESSES_CLIENTE = [
  { value: "COMPRA", label: "Compra" },
  { value: "VENDA", label: "Venda" },
  { value: "LOCACAO", label: "Locação" },
  { value: "ADMINISTRACAO", label: "Administração" },
];

export const ORDENACOES_CLIENTE = [
  { value: "nome", label: "Nome (A–Z)" },
  { value: "recentes", label: "Mais recentes" },
  { value: "antigos", label: "Mais antigos" },
];

export const TIPOS_CONTATO = [
  { value: "CELULAR", label: "Celular" },
  { value: "COMERCIAL", label: "Comercial" },
  { value: "RESIDENCIAL", label: "Residencial" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "OUTRO", label: "Outro" },
];

export const TIPOS_ENDERECO = [
  { value: "RESIDENCIAL", label: "Residencial" },
  { value: "COMERCIAL", label: "Comercial" },
  { value: "COBRANCA", label: "Cobrança" },
  { value: "OUTRO", label: "Outro" },
];

export const TIPOS_DOCUMENTO = [
  { value: "CPF", label: "CPF" },
  { value: "CNPJ", label: "CNPJ" },
  { value: "RG", label: "RG" },
  { value: "COMPROVANTE_RESIDENCIA", label: "Comprovante de residência" },
  { value: "CONTRATO", label: "Contrato" },
  { value: "OUTRO", label: "Outro" },
];

export const TIPOS_INTERACAO = [
  { value: "LIGACAO", label: "Ligação" },
  { value: "EMAIL", label: "E-mail" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "VISITA", label: "Visita" },
  { value: "REUNIAO", label: "Reunião" },
  { value: "OUTRO", label: "Outro" },
];

export const STATUS_VISITA = [
  { value: "AGENDADA", label: "Agendada" },
  { value: "REALIZADA", label: "Realizada" },
  { value: "CANCELADA", label: "Cancelada" },
  { value: "NAO_COMPARECEU", label: "Não compareceu" },
];

export const STATUS_PROPOSTA = [
  { value: "RASCUNHO", label: "Rascunho" },
  { value: "ENVIADA", label: "Enviada" },
  { value: "EM_ANALISE", label: "Em análise" },
  { value: "ACEITA", label: "Aceita" },
  { value: "RECUSADA", label: "Recusada" },
  { value: "CANCELADA", label: "Cancelada" },
];

export const HISTORY_LABELS = {
  CRIADO: "Cliente criado",
  ATUALIZADO: "Dados atualizados",
  DESATIVADO: "Cliente desativado",
  REATIVADO: "Cliente reativado",
  ANOTACAO: "Anotação adicionada",
  INTERACAO: "Interação registrada",
  DOCUMENTO_ADICIONADO: "Documento adicionado",
  DOCUMENTO_REMOVIDO: "Documento removido",
  AVATAR_ATUALIZADO: "Avatar atualizado",
  FAVORITO_ADICIONADO: "Imóvel favoritado",
  FAVORITO_REMOVIDO: "Favorito removido",
  COMPARTILHADO: "Cliente compartilhado",
  VISITA_REGISTRADA: "Visita registrada",
  PROPOSTA_REGISTRADA: "Proposta registrada",
};

export function crmStatusMeta(value) {
  return STATUS_CLIENTE_CRM.find((item) => item.value === value)
    || { value, label: value || "—", color: "default" };
}
