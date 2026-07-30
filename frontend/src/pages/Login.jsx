import { useState } from "react";
import {
  Alert,
  Box,
  Chip,
  Divider,
  IconButton,
  InputAdornment,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import {
  Apartment,
  ArrowForward,
  AutoAwesome,
  CheckCircle,
  DarkModeOutlined,
  LightModeOutlined,
  PlayCircleOutlined,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import { useAuth } from "../context/AuthContext";
import { useThemeMode } from "../context/ThemeModeContext";
import { resetTourFlag } from "../components/tour/GuidedTour";

const benefits = [
  "Imóveis, clientes e contratos em um só lugar",
  "Pipeline comercial simples e inteligente",
  "Indicadores para decisões mais rápidas",
];

export default function Login() {
  const { login, entrarDemo } = useAuth();
  const { mode, toggleMode } = useThemeMode();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErro("");
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), senha);
      navigate("/");
    } catch (error) {
      setErro(error.response?.data?.erro || "Não foi possível entrar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setErro("");
    setDemoLoading(true);
    try {
      resetTourFlag();
      await entrarDemo({ reset: false });
      navigate("/");
    } catch (error) {
      setErro(error.response?.data?.erro || "Não foi possível abrir o modo demonstração.");
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: { xs: "1fr", lg: "minmax(420px, 1.05fr) minmax(480px, .95fr)" },
        bgcolor: "background.default",
      }}
    >
      <Box
        sx={{
          display: { xs: "none", lg: "flex" },
          position: "relative",
          overflow: "hidden",
          p: { lg: 7, xl: 10 },
          flexDirection: "column",
          justifyContent: "space-between",
          color: "#fff",
          background: "radial-gradient(circle at 15% 10%, rgba(59,130,246,.55), transparent 34%), radial-gradient(circle at 90% 90%, rgba(20,184,166,.38), transparent 36%), linear-gradient(145deg, #020617 0%, #172554 48%, #0f172a 100%)",
        }}
      >
        <Box sx={{ position: "absolute", inset: 0, opacity: 0.18, backgroundImage: "linear-gradient(rgba(255,255,255,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.12) 1px, transparent 1px)", backgroundSize: "48px 48px", maskImage: "linear-gradient(to bottom, black, transparent 82%)" }} />
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ position: "relative" }}>
          <Box sx={{ width: 46, height: 46, borderRadius: 3, display: "grid", placeItems: "center", bgcolor: "#2563eb", boxShadow: "0 14px 34px rgba(37,99,235,.45)" }}><Apartment /></Box>
          <Box>
            <Typography variant="h6" fontWeight={800} lineHeight={1}>SUSSAI</Typography>
            <Typography variant="caption" sx={{ color: "#94a3b8" }}>Sistema Inteligente para Imobiliárias</Typography>
          </Box>
        </Stack>

        <Box sx={{ position: "relative", maxWidth: 650 }}>
          <Chip icon={<AutoAwesome />} label="Pronto para demonstrações comerciais" sx={{ mb: 3, bgcolor: "rgba(255,255,255,.09)", color: "#dbeafe", border: "1px solid rgba(255,255,255,.12)", "& .MuiChip-icon": { color: "#60a5fa" } }} />
          <Typography variant="h3" sx={{ fontSize: { lg: 46, xl: 58 }, lineHeight: 1.08 }}>
            Sua imobiliária,<br />mais inteligente.
          </Typography>
          <Typography sx={{ mt: 2.5, mb: 4, maxWidth: 560, fontSize: 18, lineHeight: 1.7, color: "#cbd5e1" }}>
            Uma operação conectada, moderna e pronta para transformar oportunidades em resultados.
          </Typography>
          <Stack spacing={2}>
            {benefits.map((benefit) => (
              <Stack key={benefit} direction="row" spacing={1.5} alignItems="center">
                <CheckCircle sx={{ color: "#2dd4bf", fontSize: 21 }} />
                <Typography sx={{ color: "#e2e8f0" }}>{benefit}</Typography>
              </Stack>
            ))}
          </Stack>
        </Box>

        <Typography variant="caption" sx={{ position: "relative", color: "#64748b" }}>© 2026 SUSSAI CRM. Tecnologia para quem move o mercado.</Typography>
      </Box>

      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: { xs: 2, sm: 4, lg: 7 }, position: "relative" }}>
        <IconButton onClick={toggleMode} aria-label="Alternar tema" sx={{ position: "absolute", right: 24, top: 24, border: "1px solid", borderColor: "divider" }}>
          {mode === "light" ? <DarkModeOutlined /> : <LightModeOutlined />}
        </IconButton>

        <Box sx={{ width: "100%", maxWidth: 450 }}>
          <Stack direction="row" spacing={1.25} alignItems="center" sx={{ display: { lg: "none" }, mb: 5 }}>
            <Box sx={{ width: 42, height: 42, borderRadius: 2.5, display: "grid", placeItems: "center", bgcolor: "primary.main", color: "#fff" }}><Apartment /></Box>
            <Typography variant="h6">SUSSAI CRM</Typography>
          </Stack>

          <Typography variant="h4">Bem-vindo de volta</Typography>
          <Typography color="text.secondary" sx={{ mt: 1, mb: 4 }}>Acesse sua conta para continuar sua operação.</Typography>

          <Card contentSx={{ p: { xs: 2.5, sm: 3.5 }, "&:last-child": { pb: { xs: 2.5, sm: 3.5 } } }} sx={{ boxShadow: (theme) => theme.palette.mode === "dark" ? "0 20px 50px rgba(0,0,0,.3)" : "0 24px 60px rgba(15,23,42,.08)" }}>
            {erro && <Alert severity="error" sx={{ mb: 2.5 }}>{erro}</Alert>}

            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={2.25}>
                <Input
                  label="E-mail profissional"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  autoFocus
                  required
                />
                <Input
                  label="Senha"
                  type={showSenha ? "text" : "password"}
                  value={senha}
                  onChange={(event) => setSenha(event.target.value)}
                  autoComplete="current-password"
                  required
                  helperText="Mínimo de 8 caracteres"
                  slotProps={{
                    input: {
                      endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowSenha((current) => !current)} edge="end" aria-label="Mostrar ou ocultar senha">
                          {showSenha ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                      ),
                    },
                  }}
                />
                <Button fullWidth type="submit" variant="contained" size="large" loading={loading} endIcon={!loading && <ArrowForward />}>
                  Entrar no SUSSAI
                </Button>
              </Stack>
            </Box>

            <Divider sx={{ my: 2.75 }}>
              <Typography variant="caption" color="text.secondary">ou</Typography>
            </Divider>

            <Button
              fullWidth
              variant="outlined"
              size="large"
              loading={demoLoading}
                  startIcon={!demoLoading && <PlayCircleOutlined />}
              onClick={handleDemo}
              data-tour="demo-login"
            >
              Entrar em Modo Demonstração
            </Button>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.25, textAlign: "center" }}>
              Acesso rápido com dados fictícios realistas · demo@sussai.com.br
            </Typography>

            <Typography variant="body2" sx={{ mt: 3, textAlign: "center", color: "text.secondary" }}>
              Ainda não possui uma conta?{" "}
              <Link component={RouterLink} to="/registrar" fontWeight={750} underline="hover">Criar empresa grátis</Link>
            </Typography>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}
