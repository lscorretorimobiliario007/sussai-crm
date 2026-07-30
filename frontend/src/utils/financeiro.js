export const TIPOS_LANCAMENTO = [
  { value: "A_RECEBER", label: "A receber" },
  { value: "A_PAGAR", label: "A pagar" },
];

export const STATUS_LANCAMENTO = [
  { value: "ABERTO", label: "Aberto", color: "info" },
  { value: "PARCIAL", label: "Parcial", color: "warning" },
  { value: "LIQUIDADO", label: "Liquidado", color: "success" },
  { value: "ATRASADO", label: "Atrasado", color: "error" },
  { value: "CANCELADO", label: "Cancelado", color: "default" },
];

export const STATUS_COBRANCA_FIN = [
  { value: "PENDENTE", label: "Pendente", color: "warning" },
  { value: "PAGO", label: "Pago", color: "success" },
  { value: "ATRASADO", label: "Atrasado", color: "error" },
  { value: "CANCELADO", label: "Cancelado", color: "default" },
];

export const STATUS_COMISSAO = [
  { value: "PREVISTA", label: "Prevista", color: "info" },
  { value: "APROVADA", label: "Aprovada", color: "warning" },
  { value: "PAGA", label: "Paga", color: "success" },
  { value: "CANCELADA", label: "Cancelada", color: "default" },
];

export const FORMAS_PAGAMENTO = [
  { value: "PIX", label: "PIX" },
  { value: "TED", label: "TED" },
  { value: "DINHEIRO", label: "Dinheiro" },
  { value: "CARTAO", label: "Cartão" },
  { value: "BOLETO", label: "Boleto" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "OUTRO", label: "Outro" },
];

export function optionLabel(options, value) {
  return options.find((item) => item.value === value)?.label || value || "—";
}

export function statusMeta(options, value) {
  return options.find((item) => item.value === value) || { label: value || "—", color: "default" };
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
