export function validateIdParam(req, res, next, value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ erro: "Identificador inválido" });
  }
  return next();
}
