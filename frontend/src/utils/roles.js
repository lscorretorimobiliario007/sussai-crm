export function getUserRole(usuario) {
  return usuario?.perfil || usuario?.tipo || null;
}

export function hasRole(usuario, roles = []) {
  const role = getUserRole(usuario);
  return Boolean(role && roles.includes(role));
}

export function isAdmin(usuario) {
  return hasRole(usuario, ["ADMIN"]);
}

export function isManager(usuario) {
  return hasRole(usuario, ["ADMIN", "GERENTE"]);
}
