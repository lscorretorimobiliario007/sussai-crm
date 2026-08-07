import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

function clearStoredSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
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

        const usuarioLogado = {
          id: data.id,
          nome: data.nome,
          email: data.email,
          perfil: data.perfil,
          empresaId: data.empresaId,
          empresa: data.empresa,
        };

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

    localStorage.setItem("token", token);
    localStorage.setItem("usuario", JSON.stringify(data.usuario));
    setUsuario(data.usuario);
    return data;
  };

  const login = async (email, senha) => {
    const { data } = await api.post("/auth/login", {
      email,
      senha,
    });

    return applySession(data);
  };

  const entrarDemo = async ({ reset = false } = {}) => {
    const path = reset ? "/auth/demo/reset" : "/auth/demo";
    const { data } = await api.post(path, reset ? {} : { reset: false });
    return applySession(data);
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
        entrarDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);