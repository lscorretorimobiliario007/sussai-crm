export function pickFields(source, allowedFields) {
  return allowedFields.reduce((result, field) => {
    if (Object.prototype.hasOwnProperty.call(source, field)) {
      result[field] = source[field];
    }
    return result;
  }, {});
}

export function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export function normalizeRelationIds(data, fields) {
  for (const field of fields) {
    if (!Object.prototype.hasOwnProperty.call(data, field)) continue;
    const value = data[field];
    if (value === "" || value == null) {
      data[field] = null;
    } else if (
      !["string", "number"].includes(typeof value)
      || (typeof value === "string" && value.trim() === "")
    ) {
      data[field] = Number.NaN;
    } else {
      data[field] = Number(value);
    }
  }
  return data;
}

export function normalizeNumberFields(data, fields) {
  for (const field of fields) {
    if (!Object.prototype.hasOwnProperty.call(data, field)) continue;
    if (data[field] === "" || data[field] == null) {
      data[field] = null;
      continue;
    }
    if (
      !["string", "number"].includes(typeof data[field])
      || (typeof data[field] === "string" && data[field].trim() === "")
    ) return false;
    const value = Number(data[field]);
    if (!Number.isFinite(value)) return false;
    data[field] = value;
  }
  return true;
}

export function normalizeIntegerFields(data, fields) {
  if (!normalizeNumberFields(data, fields)) return false;
  return fields.every((field) => (
    !Object.prototype.hasOwnProperty.call(data, field)
    || data[field] == null
    || Number.isInteger(data[field])
  ));
}

export function normalizeDateFields(data, fields) {
  for (const field of fields) {
    if (!Object.prototype.hasOwnProperty.call(data, field)) continue;
    if (data[field] === "" || data[field] == null) {
      data[field] = null;
      continue;
    }
    if (typeof data[field] !== "string") return false;
    const rawValue = data[field].trim();
    const dateOnlyMatch = rawValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const isoMatch = rawValue.match(/^(\d{4})-(\d{2})-(\d{2})T.+Z$/);
    const match = dateOnlyMatch || isoMatch;
    if (!match) return false;
    const value = new Date(dateOnlyMatch ? `${rawValue}T00:00:00.000Z` : rawValue);
    if (Number.isNaN(value.getTime())) return false;
    const [, year, month, day] = match.map(Number);
    if (
      value.getUTCFullYear() !== year
      || value.getUTCMonth() + 1 !== month
      || value.getUTCDate() !== day
    ) return false;
    data[field] = value;
  }
  return true;
}

export function hasInvalidEnum(data, field, allowedValues) {
  return Object.prototype.hasOwnProperty.call(data, field)
    && !allowedValues.includes(data[field]);
}

export async function belongsToEmpresa(prisma, model, id, empresaId) {
  if (id === undefined || id === null || id === "") return true;
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) return false;

  const record = await prisma[model].findFirst({
    where: { id: numericId, empresaId },
    select: { id: true },
  });

  return Boolean(record);
}

export function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : value;
}

export function isStrongEnoughPassword(value) {
  return typeof value === "string" && value.length >= 8;
}

export function sendControllerError(res, error, fallbackMessage) {
  if (error?.name === "PrismaClientValidationError") {
    return res.status(400).json({ erro: "Os dados enviados são inválidos" });
  }
  if (error?.code === "P2002") {
    return res.status(409).json({ erro: "Já existe um registro com estes dados" });
  }
  if (error?.code === "P2003") {
    return res.status(409).json({ erro: "O registro possui vínculos e não pode ser alterado ou removido" });
  }
  if (error?.code === "P2034") {
    return res.status(409).json({ erro: "A operação entrou em conflito com outra alteração. Tente novamente." });
  }
  if (error?.code === "P2025") {
    return res.status(404).json({ erro: "Registro não encontrado" });
  }
  console.error(error);
  return res.status(500).json({ erro: fallbackMessage });
}
