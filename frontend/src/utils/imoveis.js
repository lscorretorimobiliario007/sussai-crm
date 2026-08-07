export const FINALIDADES_IMOVEL = [
  { value: "VENDA", label: "Venda" },
  { value: "LOCACAO", label: "Locação" },
];

export const TIPOS_IMOVEL = [
  { value: "CASA", label: "Casa" },
  { value: "APARTAMENTO", label: "Apartamento" },
  { value: "TERRENO", label: "Terreno" },
  { value: "COMERCIAL", label: "Comercial" },
  { value: "RURAL", label: "Rural" },
  { value: "OUTRO", label: "Outro" },
];

export function optionLabel(options, value) {
  return options.find((option) => option.value === value)?.label || value || "—";
}
