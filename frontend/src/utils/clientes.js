export const TIPOS_CLIENTE = [
  { value: "INQUILINO", label: "Inquilino" },
  { value: "COMPRADOR", label: "Comprador" },
  { value: "LEAD", label: "Lead" },
];

export const TIPOS_CLIENTE_TODOS = [
  { value: "PROPRIETARIO", label: "Proprietário" },
  ...TIPOS_CLIENTE,
];

export const TIPOS_PESSOA = [
  { value: "PF", label: "Pessoa física" },
  { value: "PJ", label: "Pessoa jurídica" },
];

export const STATUS_CLIENTE = [
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

export const ORDENACOES_CLIENTE = [
  { value: "nome", label: "Nome A–Z" },
  { value: "recentes", label: "Mais recentes" },
  { value: "antigos", label: "Mais antigos" },
];

export const HISTORY_LABELS = {
  CRIADO: "Cliente cadastrado",
  ATUALIZADO: "Informações atualizadas",
  DESATIVADO: "Cliente desativado",
  REATIVADO: "Cliente reativado",
  ANOTACAO: "Anotação adicionada",
  INTERACAO: "Interação registrada",
  DOCUMENTO_ADICIONADO: "Documento adicionado",
  DOCUMENTO_REMOVIDO: "Documento removido",
  AVATAR_ATUALIZADO: "Avatar atualizado",
  FAVORITO_ADICIONADO: "Imóvel favoritado",
  FAVORITO_REMOVIDO: "Favorito removido",
  COMPARTILHADO: "Cadastro compartilhado",
  VISITA_REGISTRADA: "Visita registrada",
  PROPOSTA_REGISTRADA: "Proposta registrada",
};

export function optionLabel(options, value) {
  return options.find((option) => option.value === value)?.label || value || "—";
}

export function statusMeta(value) {
  return STATUS_CLIENTE.find((item) => item.value === value) || { label: value, color: "default" };
}
