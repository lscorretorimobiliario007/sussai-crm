const PROPERTY_OWNER_FIELDS = [
  "nome",
  "cpf",
  "cnpj",
  "rg",
  "telefone",
  "celular",
  "whatsapp",
  "email",
  "cep",
  "rua",
  "numero",
  "complemento",
  "bairro",
  "cidade",
  "estado",
  "observacoes",
];

const DIGIT_FIELDS = new Set([
  "cpf",
  "cnpj",
  "telefone",
  "celular",
  "whatsapp",
  "cep",
]);

export function createEmptyPropertyOwner() {
  return Object.fromEntries(PROPERTY_OWNER_FIELDS.map((field) => [field, ""]));
}

export function propertyOwnerToForm(owner = {}) {
  return Object.fromEntries(
    PROPERTY_OWNER_FIELDS.map((field) => [field, owner[field] ?? ""])
  );
}

export function createPropertyOwnerPayload(form) {
  return Object.fromEntries(
    PROPERTY_OWNER_FIELDS.map((field) => {
      const rawValue = String(form[field] ?? "");
      const normalized = DIGIT_FIELDS.has(field)
        ? rawValue.replace(/\D/g, "")
        : rawValue.trim();

      return [
        field,
        field === "nome"
          ? normalized
          : field === "estado"
            ? normalized.toUpperCase() || null
            : normalized || null,
      ];
    })
  );
}

export function getPropertyOwnerError(error, fallback) {
  const message = error.response?.data?.message ?? error.response?.data?.erro;
  return (Array.isArray(message) ? message.join(", ") : message) || fallback;
}
