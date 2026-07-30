import { useState } from "react";
import {
  Alert,
  Box,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import {
  Apartment,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import { useAuth } from "../context/AuthContext";

export default function Registrar() {
  const { registrar } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    empresaNome: "",
    empresaCnpj: "",
    empresaEmail: "",
    empresaTelefone: "",
    nome: "",
    email: "",
    senha: "",
  });
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSenha, setShowSenha] = useState(false);

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    if (form.senha.length < 8) {
      setErro("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    setLoading(true);
    try {
      await registrar({
        ...form,
        email: form.email.trim().toLowerCase(),
        empresaEmail: form.empresaEmail.trim().toLowerCase(),
      });
      navigate("/");
    } catch (err) {
      setErro(err.response?.data?.erro || "Erro ao registrar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: { xs: "1fr", lg: "minmax(420px, 1fr) minmax(480px, 1fr)" },
        bgcolor: "background.default",
      }}
    >
      <Box
        sx={{
          display: { xs: "none", lg: "flex" },
          flexDirection: "column",
          justifyContent: "space-between",
          p: { lg: 7, xl: 10 },
          color: "#fff",
          background: "radial-gradient(circle at 15% 10%, rgba(59,130,246,.55), transparent 34%), radial-gradient(circle at 90% 90%, rgba(20,184,166,.38), transparent 36%), linear-gradient(145deg, #020617 0%, #172554 48%, #0f172a 100%)",
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{ width: 46, height: 46, borderRadius: 3, display: "grid", placeItems: "center", bgcolor: "#2563eb" }}>
            <Apartment />
          </Box>
          <Typography variant="h5" fontWeight={800}>SUSSAI CRM</Typography>
        </Stack>
        <Box>
          <Typography variant="h3" fontWeight={800} sx={{ maxWidth: 420, lineHeight: 1.15 }}>
            Crie sua imobiliária em minutos
          </Typography>
          <Typography sx={{ mt: 2, color: "rgba(255,255,255,.78)", maxWidth: 400 }}>
            Plano Starter gratuito para começar. Imóveis, clientes, pipeline e financeiro em um só lugar.
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: "rgba(255,255,255,.55)" }}>
          Multi-tenant · Pronto para operação real
        </Typography>
      </Box>

      <Box sx={{ display: "grid", placeItems: "center", p: { xs: 2, md: 4 } }}>
        <Card sx={{ maxWidth: 560, width: "100%" }} contentSx={{ p: { xs: 3, md: 4 } }}>
          <Typography variant="h5" fontWeight={800} gutterBottom>
            Criar sua imobiliária
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Comece grátis com o plano Starter. Sem cartão de crédito.
          </Typography>

          {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              Dados da Empresa
            </Typography>
            <Grid container spacing={2} sx={{ mb: 1 }}>
              <Grid size={{ xs: 12 }}>
                <Input fullWidth label="Nome da Imobiliária *" value={form.empresaNome} onChange={handleChange("empresaNome")} required />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Input fullWidth label="CNPJ" value={form.empresaCnpj} onChange={handleChange("empresaCnpj")} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Input fullWidth label="Telefone" value={form.empresaTelefone} onChange={handleChange("empresaTelefone")} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Input fullWidth label="E-mail da Empresa *" type="email" value={form.empresaEmail} onChange={handleChange("empresaEmail")} required />
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" color="primary" gutterBottom>
              Administrador
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <Input fullWidth label="Seu Nome *" value={form.nome} onChange={handleChange("nome")} required />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Input fullWidth label="Seu E-mail *" type="email" value={form.email} onChange={handleChange("email")} required />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Input
                  fullWidth
                  label="Senha *"
                  type={showSenha ? "text" : "password"}
                  value={form.senha}
                  onChange={handleChange("senha")}
                  required
                  helperText="Mínimo de 8 caracteres"
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton edge="end" aria-label="Mostrar senha" onClick={() => setShowSenha((v) => !v)}>
                            {showSenha ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Grid>
            </Grid>

            <Button fullWidth type="submit" variant="contained" size="large" sx={{ mt: 3 }} loading={loading}>
              Criar Conta Grátis
            </Button>
          </Box>

          <Typography variant="body2" sx={{ mt: 2, textAlign: "center" }}>
            Já tem conta?{" "}
            <Link component={RouterLink} to="/login" fontWeight={600}>Entrar</Link>
          </Typography>
        </Card>
      </Box>
    </Box>
  );
}
