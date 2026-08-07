import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CircularProgress, Box } from "@mui/material";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/auth";
import { ThemeModeProvider } from "./context/ThemeModeContext";
import { ToastProvider } from "./components/ui/Toast";
import { hasRole } from "./utils/roles";

const Login = lazy(() => import("./pages/Login"));
const Registrar = lazy(() => import("./pages/Registrar"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Imoveis = lazy(() => import("./pages/Imoveis"));
const ImovelForm = lazy(() => import("./pages/ImovelForm"));
const ImovelDetalhes = lazy(() => import("./pages/ImovelDetalhes"));
const Proprietarios = lazy(() => import("./pages/Proprietarios"));
const ProprietarioForm = lazy(() => import("./pages/ProprietarioForm"));
const ProprietarioDetalhes = lazy(() => import("./pages/ProprietarioDetalhes"));
const Clientes = lazy(() => import("./pages/Clientes"));
const ClienteForm = lazy(() => import("./pages/ClienteForm"));
const ClienteDetalhes = lazy(() => import("./pages/ClienteDetalhes"));
const Leads = lazy(() => import("./pages/Leads"));
const Agenda = lazy(() => import("./pages/Agenda"));
const Tarefas = lazy(() => import("./pages/Tarefas"));
const Contratos = lazy(() => import("./pages/Contratos"));
const Financeiro = lazy(() => import("./pages/Financeiro"));
const Corretores = lazy(() => import("./pages/Corretores"));
const CorretorForm = lazy(() => import("./pages/CorretorForm"));
const CorretorDetalhes = lazy(() => import("./pages/CorretorDetalhes"));
const Configuracoes = lazy(() => import("./pages/Configuracoes"));
const Perfil = lazy(() => import("./pages/Perfil"));
const Notificacoes = lazy(() => import("./pages/Notificacoes"));
const Auditoria = lazy(() => import("./pages/Auditoria"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Integracoes = lazy(() => import("./pages/Integracoes"));
const Backup = lazy(() => import("./pages/Backup"));
const Logs = lazy(() => import("./pages/Logs"));
const Documentos = lazy(() => import("./pages/Documentos"));
const Relatorios = lazy(() => import("./pages/Relatorios"));
const Pesquisa = lazy(() => import("./pages/Pesquisa"));

function RouteLoading() {
  return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
      <CircularProgress />
    </Box>
  );
}

function AuthLoading() {
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

function PrivateRoute({ children }) {
  const { usuario, loading } = useAuth();
  if (loading) return <AuthLoading />;
  return usuario ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { usuario, loading } = useAuth();
  if (loading) return <AuthLoading />;
  return usuario ? <Navigate to="/" replace /> : children;
}

function RoleRoute({ children, roles }) {
  const { usuario, loading } = useAuth();
  if (loading) return <AuthLoading />;
  if (!usuario) return <Navigate to="/login" replace />;
  if (!hasRole(usuario, roles)) return <Navigate to="/" replace />;
  return children;
}

function privateElement(element) {
  return <PrivateRoute>{element}</PrivateRoute>;
}

function roleElement(element, roles) {
  return (
    <PrivateRoute>
      <RoleRoute roles={roles}>{element}</RoleRoute>
    </PrivateRoute>
  );
}

export default function App() {
  return (
    <ThemeModeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Suspense fallback={<RouteLoading />}>
              <Routes>
                <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                <Route path="/registrar" element={<PublicRoute><Registrar /></PublicRoute>} />

                <Route path="/" element={privateElement(<Dashboard />)} />

                <Route path="/imoveis" element={privateElement(<Imoveis />)} />
                <Route path="/imoveis/novo" element={privateElement(<ImovelForm />)} />
                <Route path="/imoveis/:id" element={privateElement(<ImovelDetalhes />)} />
                <Route path="/imoveis/:id/editar" element={privateElement(<ImovelForm />)} />

                <Route path="/proprietarios" element={privateElement(<Proprietarios />)} />
                <Route path="/proprietarios/novo" element={privateElement(<ProprietarioForm />)} />
                <Route path="/proprietarios/:id" element={privateElement(<ProprietarioDetalhes />)} />
                <Route path="/proprietarios/:id/editar" element={privateElement(<ProprietarioForm />)} />

                <Route path="/clientes" element={privateElement(<Clientes />)} />
                <Route path="/clientes/novo" element={privateElement(<ClienteForm />)} />
                <Route path="/clientes/:id" element={privateElement(<ClienteDetalhes />)} />
                <Route path="/clientes/:id/editar" element={privateElement(<ClienteForm />)} />

                <Route path="/leads" element={privateElement(<Leads />)} />
                <Route path="/agenda" element={privateElement(<Agenda />)} />
                <Route path="/tarefas" element={privateElement(<Tarefas />)} />
                <Route path="/contratos" element={privateElement(<Contratos />)} />
                <Route path="/documentos" element={privateElement(<Documentos />)} />
                <Route path="/relatorios" element={privateElement(<Relatorios />)} />
                <Route path="/notificacoes" element={privateElement(<Notificacoes />)} />
                <Route path="/perfil" element={privateElement(<Perfil />)} />
                <Route path="/pesquisa" element={privateElement(<Pesquisa />)} />

                <Route path="/financeiro" element={roleElement(<Financeiro />, ["ADMIN", "GERENTE"])} />
                <Route path="/corretores" element={roleElement(<Corretores />, ["ADMIN", "GERENTE"])} />
                <Route path="/corretores/novo" element={roleElement(<CorretorForm />, ["ADMIN", "GERENTE"])} />
                <Route path="/corretores/:id" element={roleElement(<CorretorDetalhes />, ["ADMIN", "GERENTE"])} />
                <Route path="/corretores/:id/editar" element={roleElement(<CorretorForm />, ["ADMIN", "GERENTE"])} />
                <Route path="/configuracoes" element={roleElement(<Configuracoes />, ["ADMIN", "GERENTE"])} />

                <Route path="/auditoria" element={roleElement(<Auditoria />, ["ADMIN"])} />
                <Route path="/admin" element={roleElement(<AdminDashboard />, ["ADMIN"])} />
                <Route path="/integracoes" element={roleElement(<Integracoes />, ["ADMIN"])} />
                <Route path="/backup" element={roleElement(<Backup />, ["ADMIN"])} />
                <Route path="/logs" element={roleElement(<Logs />, ["ADMIN"])} />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeModeProvider>
  );
}
