import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CircularProgress, Box } from "@mui/material";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeModeProvider } from "./context/ThemeModeContext";
import { ToastProvider } from "./components/ui/Toast";

import Login from "./pages/Login";
import Registrar from "./pages/Registrar";
import Dashboard from "./pages/Dashboard";

import Imoveis from "./pages/Imoveis";
import ImovelForm from "./pages/ImovelForm";
import ImovelDetalhes from "./pages/ImovelDetalhes";

import Clientes from "./pages/Clientes";
import ClienteForm from "./pages/ClienteForm";
import ClienteDetalhes from "./pages/ClienteDetalhes";

import Proprietarios from "./pages/Proprietarios";
import ProprietarioForm from "./pages/ProprietarioForm";
import ProprietarioDetalhes from "./pages/ProprietarioDetalhes";

import Corretores from "./pages/Corretores";
import CorretorForm from "./pages/CorretorForm";
import CorretorDetalhes from "./pages/CorretorDetalhes";

import Leads from "./pages/Leads";
import Contratos from "./pages/Contratos";
import Financeiro from "./pages/Financeiro";
import Tarefas from "./pages/Tarefas";
import Agenda from "./pages/Agenda";
import Configuracoes from "./pages/Configuracoes";

function PrivateRoute({ children }) {
  const { usuario, loading } = useAuth();

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return usuario ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { usuario, loading } = useAuth();

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return usuario ? <Navigate to="/" replace /> : children;
}

function RoleRoute({ roles, children }) {
  const { usuario } = useAuth();

  return roles.includes(usuario?.perfil)
    ? children
    : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <ThemeModeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />

              <Route
                path="/registrar"
                element={
                  <PublicRoute>
                    <Registrar />
                  </PublicRoute>
                }
              />

              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />

              <Route
                path="/imoveis"
                element={
                  <PrivateRoute>
                    <Imoveis />
                  </PrivateRoute>
                }
              />

              <Route
                path="/imoveis/novo"
                element={
                  <PrivateRoute>
                    <ImovelForm />
                  </PrivateRoute>
                }
              />

              <Route
                path="/imoveis/:id"
                element={
                  <PrivateRoute>
                    <ImovelDetalhes />
                  </PrivateRoute>
                }
              />

              <Route
                path="/imoveis/:id/editar"
                element={
                  <PrivateRoute>
                    <ImovelForm />
                  </PrivateRoute>
                }
              />

              <Route
                path="/clientes"
                element={
                  <PrivateRoute>
                    <Clientes />
                  </PrivateRoute>
                }
              />

              <Route
                path="/clientes/novo"
                element={
                  <PrivateRoute>
                    <ClienteForm />
                  </PrivateRoute>
                }
              />

              <Route
                path="/clientes/:id"
                element={
                  <PrivateRoute>
                    <ClienteDetalhes />
                  </PrivateRoute>
                }
              />

              <Route
                path="/clientes/:id/editar"
                element={
                  <PrivateRoute>
                    <ClienteForm />
                  </PrivateRoute>
                }
              />

              <Route
                path="/proprietarios"
                element={
                  <PrivateRoute>
                    <Proprietarios />
                  </PrivateRoute>
                }
              />

              <Route
                path="/proprietarios/novo"
                element={
                  <PrivateRoute>
                    <ProprietarioForm />
                  </PrivateRoute>
                }
              />

              <Route
                path="/proprietarios/:id"
                element={
                  <PrivateRoute>
                    <ProprietarioDetalhes />
                  </PrivateRoute>
                }
              />

              <Route
                path="/proprietarios/:id/editar"
                element={
                  <PrivateRoute>
                    <ProprietarioForm />
                  </PrivateRoute>
                }
              />

              <Route
                path="/corretores"
                element={
                  <PrivateRoute>
                    <Corretores />
                  </PrivateRoute>
                }
              />

              <Route
                path="/corretores/novo"
                element={
                  <PrivateRoute>
                    <RoleRoute roles={["ADMIN", "GERENTE"]}>
                      <CorretorForm />
                    </RoleRoute>
                  </PrivateRoute>
                }
              />

              <Route
                path="/corretores/:id"
                element={
                  <PrivateRoute>
                    <CorretorDetalhes />
                  </PrivateRoute>
                }
              />

              <Route
                path="/corretores/:id/editar"
                element={
                  <PrivateRoute>
                    <CorretorForm />
                  </PrivateRoute>
                }
              />

              <Route
                path="/leads"
                element={
                  <PrivateRoute>
                    <Leads />
                  </PrivateRoute>
                }
              />

              <Route
                path="/contratos"
                element={
                  <PrivateRoute>
                    <Contratos />
                  </PrivateRoute>
                }
              />

              <Route
                path="/financeiro"
                element={
                  <PrivateRoute>
                    <RoleRoute roles={["ADMIN", "GERENTE"]}>
                      <Financeiro />
                    </RoleRoute>
                  </PrivateRoute>
                }
              />

              <Route
                path="/tarefas"
                element={
                  <PrivateRoute>
                    <Tarefas />
                  </PrivateRoute>
                }
              />

              <Route
                path="/agenda"
                element={
                  <PrivateRoute>
                    <Agenda />
                  </PrivateRoute>
                }
              />

              <Route
                path="/configuracoes"
                element={
                  <PrivateRoute>
                    <Configuracoes />
                  </PrivateRoute>
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeModeProvider>
  );
} 