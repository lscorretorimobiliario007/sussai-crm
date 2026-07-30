export const FINALIDADES_IMOVEL = [
  { value: "VENDA", label: "Venda" },
  { value: "LOCACAO", label: "Locação" },
  { value: "VENDA_E_LOCACAO", label: "Venda e locação" },
];

export const TIPOS_IMOVEL = [
  { value: "APARTAMENTO", label: "Apartamento" },
  { value: "CASA", label: "Casa" },
  { value: "TERRENO", label: "Terreno" },
  { value: "COMERCIAL", label: "Imóvel comercial" },
  { value: "RURAL", label: "Imóvel rural" },
  { value: "KITNET", label: "Kitnet" },
  { value: "SOBRADO", label: "Sobrado" },
  { value: "COBERTURA", label: "Cobertura" },
  { value: "GALPAO", label: "Galpão" },
  { value: "SALA_COMERCIAL", label: "Sala comercial" },
];

export const STATUS_OPTIONS = [
  { value: "DISPONIVEL", label: "Disponível" },
  { value: "RESERVADO", label: "Reservado" },
  { value: "VENDIDO", label: "Vendido" },
  { value: "ALUGADO", label: "Alugado" },
];

export const OCUPACOES_IMOVEL = [
  { value: "DESOCUPADO", label: "Desocupado" },
  { value: "OCUPADO_PROPRIETARIO", label: "Ocupado pelo proprietário" },
  { value: "OCUPADO_INQUILINO", label: "Ocupado por inquilino" },
  { value: "EM_REFORMA", label: "Em reforma" },
];

export const ORIGENS_CAPTACAO = [
  { value: "INDICACAO", label: "Indicação" },
  { value: "PLACA", label: "Placa" },
  { value: "SITE", label: "Site" },
  { value: "REDES_SOCIAIS", label: "Redes sociais" },
  { value: "CAPTACAO_ATIVA", label: "Captação ativa" },
  { value: "PROPRIETARIO", label: "Proprietário procurou" },
  { value: "PARCEIRO", label: "Parceiro" },
  { value: "PORTAIS", label: "Portais" },
  { value: "OUTRO", label: "Outro" },
];

export const SITUACOES_CAPTACAO = [
  { value: "EM_ANALISE", label: "Em análise" },
  { value: "DOCUMENTACAO", label: "Documentação" },
  { value: "ATIVO", label: "Ativo / publicado" },
  { value: "NEGOCIACAO", label: "Em negociação" },
  { value: "SUSPENSO", label: "Suspenso" },
  { value: "ENCERRADO", label: "Encerrado" },
];

export const HISTORY_ACTION_LABELS = {
  CRIADO: "Imóvel cadastrado",
  ATUALIZADO: "Informações atualizadas",
  DESATIVADO: "Imóvel desativado",
  REATIVADO: "Imóvel reativado",
  FOTO_ADICIONADA: "Fotos adicionadas",
  FOTO_REMOVIDA: "Foto removida",
  FOTO_PRINCIPAL: "Foto principal alterada",
  FOTO_REORDENADA: "Galeria reordenada",
  PUBLICADO: "Publicado no site",
  RETIRADO_SITE: "Retirado do site",
  PRECO_ALTERADO: "Preço alterado",
  PROPRIETARIO_ALTERADO: "Proprietário alterado",
  CHAVE_RETIRADA: "Chave retirada",
  CHAVE_DEVOLVIDA: "Chave devolvida",
};

export function describeHistoryEntry(entry) {
  const label = HISTORY_ACTION_LABELS[entry.acao] || entry.acao;
  const changes = entry.alteracoes || {};
  if (entry.acao === "ATUALIZADO") {
    const fields = Object.keys(changes);
    if (!fields.length) return label;
    return `${label}: ${fields.slice(0, 6).join(", ")}${fields.length > 6 ? "…" : ""}`;
  }
  if (entry.acao === "PRECO_ALTERADO") {
    const parts = [];
    if (changes.valorVenda) parts.push("venda");
    if (changes.valorAluguel) parts.push("locação");
    return parts.length ? `Preço alterado (${parts.join(" e ")})` : label;
  }
  if (entry.acao === "CHAVE_RETIRADA" && changes.retiradoPor) {
    return `Chave retirada por ${changes.retiradoPor}`;
  }
  if (entry.acao === "CHAVE_DEVOLVIDA" && changes.devolvidoPor) {
    return `Chave devolvida por ${changes.devolvidoPor}`;
  }
  if (entry.acao === "FOTO_ADICIONADA" && changes.quantidade) {
    return `${changes.quantidade} foto(s) adicionada(s)`;
  }
  return label;
}

export function phoneDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

export function whatsappLink(value) {
  const digits = phoneDigits(value);
  if (!digits) return null;
  const withCountry = digits.length <= 11 ? `55${digits}` : digits;
  return `https://wa.me/${withCountry}`;
}

/** Filtros canônicos site (ordem de apresentação). */
export const FILTROS_CARACTERISTICAS_SITE = [
  { value: "PISCINA", label: "Piscina" },
  { value: "EDICULA", label: "Edícula" },
  { value: "CHURRASQUEIRA", label: "Churrasqueira" },
  { value: "AREA_GOURMET", label: "Área Gourmet" },
  { value: "ENERGIA_SOLAR", label: "Energia Solar" },
  { value: "POCO_ARTESIANO", label: "Poço artesiano" },
  { value: "PORTAO_ELETRONICO", label: "Portão eletrônico" },
  { value: "CLOSET", label: "Closet" },
  { value: "ESCRITORIO", label: "Escritório" },
  { value: "LAVABO", label: "Lavabo" },
  { value: "SACADA", label: "Sacada" },
  { value: "ELEVADOR", label: "Elevador" },
  { value: "MOBILIADO", label: "Mobiliado" },
  { value: "SEMI_MOBILIADO", label: "Semi mobiliado" },
  { value: "AR_CONDICIONADO", label: "Ar condicionado" },
  { value: "AQUECIMENTO", label: "Aquecimento" },
  { value: "INTERNET", label: "Internet" },
  { value: "GAS_ENCANADO", label: "Gás encanado" },
  { value: "AUTOMACAO", label: "Automação" },
  { value: "JARDIM", label: "Jardim" },
  { value: "PLANEJADOS", label: "Planejados" },
  { value: "ACADEMIA", label: "Academia" },
  { value: "QUADRA", label: "Quadra" },
  { value: "SALAO_FESTAS", label: "Salão de festas" },
  { value: "PORTARIA", label: "Portaria" },
];

/** Catálogo completo CRM. */
export const CARACTERISTICAS_IMOVEL = [
  ...FILTROS_CARACTERISTICAS_SITE,
  { value: "VARANDA", label: "Varanda" },
  { value: "PORTARIA_24H", label: "Portaria 24h" },
  { value: "ACEITA_PETS", label: "Aceita pets" },
  { value: "PLAYGROUND", label: "Playground" },
];

export const ORDENACOES_IMOVEL = [
  { value: "recentes", label: "Mais recentes" },
  { value: "antigos", label: "Mais antigos" },
  { value: "maior_valor", label: "Maior valor" },
  { value: "menor_valor", label: "Menor valor" },
  { value: "titulo", label: "Título A–Z" },
];

export function optionLabel(options, value) {
  return options.find((option) => option.value === value)?.label || value || "—";
}

export function toDateInputValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function googleMapsSearchUrl({ endereco, numero, bairro, cidade, estado, cep, latitude, longitude }) {
  if (latitude && longitude) {
    return `https://www.google.com/maps?q=${latitude},${longitude}`;
  }
  const query = [endereco, numero, bairro, cidade, estado, cep].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
