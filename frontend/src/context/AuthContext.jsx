import { useState, useEffect } from "react";
import api from "../api/axios";
import { AuthContext, useAuth } from "./auth";

export { useAuth };

function clearStoredSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
}

function apiErrorMessage(error, fallback) {
  const data = error?.response?.data;
  if (!data) return fallback;
  if (typeof data.erro === "string" && data.erro) return data.erro;
  if (typeof data.message === "string" && data.message) return data.message;
  if (Array.isArray(data.message) && data.message[0]) return data.message[0];
  return fallback;
}

function normalizeUsuario(data) {
  if (!data) return null;
  const perfil = data.perfil || data.tipo || null;
  const empresa = data.empresa
    || (data.empresaNome ? { nome: data.empresaNome, id: data.empresaId } : null);

  return {
    id: data.id,
    nome: data.nome,
    email: data.email,
    perfil,
    tipo: perfil,
    empresaId: data.empresaId,
    empresa,
    telefone: data.telefone || null,
    demo: Boolean(data.demo),
  };
}

function persistSession(token, usuario) {
  if (token) localStorage.setItem("token", token);
  localStorage.setItem("usuario", JSON.stringify(usuario));
}

function extractAuthPayload(data) {
  const token = data?.access_token || data?.token;
  const usuarioLogado = normalizeUsuario(data?.usuario || data);
  return { token, usuarioLogado };
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarUsuario() {
      const token = localStorage.getItem("token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        let data;
        try {
          ({ data } = await api.get("/auth/me"));
        } catch {
          ({ data } = await api.get("/auth/perfil"));
        }

        const usuarioLogado = normalizeUsuario(data);
        setUsuario(usuarioLogado);
        localStorage.setItem("usuario", JSON.stringify(usuarioLogado));
      } catch (error) {
        console.error("Erro ao carregar usuário:", error);
        clearStoredSession();
        setUsuario(null);
      } finally {
        setLoading(false);
      }
    }

    carregarUsuario();
  }, []);

  const login = async (email, senha) => {
    const { data } = await api.post("/auth/login", { email, senha });
    const { token, usuarioLogado } = extractAuthPayload(data);
    if (!token) {
      const err = new Error("Resposta de login sem token");
      err.response = { data: { erro: "Resposta de login inválida" } };
      throw err;
    }
    persistSession(token, usuarioLogado);
    setUsuario(usuarioLogado);
    return data;
  };

  const registrar = async (payload) => {
    const { data } = await api.post("/auth/registrar", payload);
    const { token, usuarioLogado } = extractAuthPayload(data);
    if (token) {
      persistSession(token, usuarioLogado);
      setUsuario(usuarioLogado);
    }
    return data;
  };

  const entrarDemo = async ({ reset = false } = {}) => {
    const { data } = reset
      ? await api.post("/auth/demo/reset")
      : await api.post("/auth/demo", { reset: false });
    const { token, usuarioLogado } = extractAuthPayload(data);
    if (!token) {
      const err = new Error(apiErrorMessage({ response: { data } }, "Demo indisponível"));
      err.response = { data: { erro: err.message } };
      throw err;
    }
    persistSession(token, usuarioLogado);
    setUsuario(usuarioLogado);
    return data;
  };

  const refreshUsuario = async () => {
    try {
      let data;
      try {
        ({ data } = await api.get("/auth/me"));
      } catch {
        ({ data } = await api.get("/auth/perfil"));
      }
      const usuarioLogado = normalizeUsuario(data);
      setUsuario(usuarioLogado);
      localStorage.setItem("usuario", JSON.stringify(usuarioLogado));
      return usuarioLogado;
    } catch {
      return null;
    }
  };

  const logout = () => {
    clearStoredSession();
    setUsuario(null);
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        loading,
        login,
        logout,
        registrar,
        entrarDemo,
        refreshUsuario,
        apiErrorMessage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
