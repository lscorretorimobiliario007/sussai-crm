import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

function clearStoredSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
}

function mapUsuario(data) {
  if (!data) return null;

  return {
    id: data.id,
    nome: data.nome,
    email: data.email,
    perfil: data.perfil,
    tipo: data.tipo || data.perfil,
    empresaId: data.empresaId,
    empresaNome:
      data.empresaNome
      ?? data.empresa?.nomeFantasia
      ?? data.empresa?.nome
      ?? null,
    plano: data.plano ?? data.empresa?.plano ?? null,
    demo: Boolean(data.demo) || data.email === "demo@sussai.com.br",
    empresa: data.empresa,
  };
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
        const { data } = await api.get("/auth/me");
        const usuarioLogado = mapUsuario(data);

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

  const applySession = (data) => {
    const token = data.access_token || data.token;
    if (!token) {
      throw new Error("Token de autenticação ausente na resposta");
    }

    const usuarioLogado = mapUsuario(data.usuario || data);
    localStorage.setItem("token", token);
    localStorage.setItem("usuario", JSON.stringify(usuarioLogado));
    setUsuario(usuarioLogado);
    return data;
  };

  const login = async (email, senha) => {
    const { data } = await api.post("/auth/login", {
      email,
      senha,
    });

    return applySession(data);
  };

  const registrar = async (payload) => {
    const { data } = await api.post("/auth/registrar", payload);
    const token = data.access_token || data.token;

    if (token) {
      return applySession(data);
    }

    window.location.assign("/login");
    return data;
  };

  const entrarDemo = async ({ reset = false } = {}) => {
    const path = reset ? "/auth/demo/reset" : "/auth/demo";
    const { data } = await api.post(path, reset ? {} : { reset: false });
    return applySession(data);
  };

  const resetarDemo = () => entrarDemo({ reset: true });

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
        resetarDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
