export const HISTORY_LABELS = {
  CRIADO: "Lead criado",
  ATUALIZADO: "Informações atualizadas",
  MOVIDO: "Movido no pipeline",
  COMENTARIO: "Comentário adicionado",
  ANEXO_ADICIONADO: "Anexo adicionado",
  ANEXO_REMOVIDO: "Anexo removido",
  TAREFA_VINCULADA: "Tarefa vinculada",
  AGENDA_VINCULADA: "Compromisso agendado",
  GANHO: "Marcado como ganho",
  PERDIDO: "Marcado como perdido",
  REABERTO: "Reaberto no funil",
};

export function probabilidadeLabel(value) {
  if (value == null) return "—";
  return `${value}%`;
}
