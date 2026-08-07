import { useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Chip,
  Divider,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { LockOutlined, Logout, PersonOutlined } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import { useToast } from "../context/toast";
import { useAuth } from "../context/auth";
import api from "../api/axios";
import { getUserRole } from "../utils/roles";

export default function Perfil() {
  const { usuario, logout, refreshUsuario } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [saving, setSaving] = useState(false);
  const [info, setInfo] = useState("");

  const role = getUserRole(usuario);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const alterarSenha = async (event) => {
    event.preventDefault();
    setInfo("");

    if (novaSenha.length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (novaSenha !== confirmacao) {
      toast.error("A confirmação da senha não confere.");
      return;
    }

    setSaving(true);
    try {
      const payload = { senhaAtual, novaSenha, senha: novaSenha };
      try {
        await api.put("/auth/me", payload);
      } catch (firstError) {
        if (firstError.response?.status === 404) {
          await api.put("/users/me", payload);
        } else {
          throw firstError;
        }
      }
      toast.success("Senha atualizada com sucesso.");
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmacao("");
      await refreshUsuario?.();
    } catch (error) {
      if (error.response?.status === 404) {
        setInfo("A API de alteração de senha ainda não está disponível. Exibindo apenas o perfil.");
        toast.warning("Endpoint de senha indisponível no momento.");
      } else {
        toast.error(error.response?.data?.erro || error.response?.data?.message || "Não foi possível alterar a senha.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout title="Meu perfil">
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Card premium>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ width: 72, height: 72, bgcolor: "primary.main", fontWeight: 800, fontSize: 24 }}>
                {usuario?.nome?.slice(0, 2).toUpperCase()}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h5" fontWeight={800} noWrap>{usuario?.nome}</Typography>
                <Typography variant="body2" color="text.secondary" noWrap>{usuario?.email}</Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
                  {role && <Chip size="small" color="primary" label={role} />}
                  {usuario?.empresa?.nome && <Chip size="small" variant="outlined" label={usuario.empresa.nome} />}
                </Stack>
              </Box>
            </Stack>

            <Divider sx={{ my: 2.5 }} />

            <Stack spacing={1.25}>
              <Stack direction="row" spacing={1} alignItems="center">
                <PersonOutlined fontSize="small" color="action" />
                <Typography variant="body2">ID #{usuario?.id}</Typography>
              </Stack>
              {usuario?.telefone && (
                <Typography variant="body2" color="text.secondary">Telefone: {usuario.telefone}</Typography>
              )}
              <Typography variant="body2" color="text.secondary">
                Empresa ID: {usuario?.empresaId || "—"}
              </Typography>
            </Stack>

            <Button
              variant="outlined"
              color="inherit"
              startIcon={<Logout />}
              onClick={handleLogout}
              sx={{ mt: 3 }}
              fullWidth
            >
              Sair da conta
            </Button>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <Card>
            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2 }}>
              <LockOutlined color="primary" />
              <Box>
                <Typography variant="h6" fontWeight={800}>Alterar senha</Typography>
                <Typography variant="body2" color="text.secondary">
                  Atualize suas credenciais com segurança.
                </Typography>
              </Box>
            </Stack>

            {info && <Alert severity="info" sx={{ mb: 2 }}>{info}</Alert>}

            <Box component="form" onSubmit={alterarSenha}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <Input
                    label="Senha atual"
                    type="password"
                    value={senhaAtual}
                    onChange={(e) => setSenhaAtual(e.target.value)}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Input
                    label="Nova senha"
                    type="password"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Input
                    label="Confirmar nova senha"
                    type="password"
                    value={confirmacao}
                    onChange={(e) => setConfirmacao(e.target.value)}
                    required
                  />
                </Grid>
              </Grid>
              <Button type="submit" variant="contained" loading={saving} sx={{ mt: 2.5 }}>
                Salvar nova senha
              </Button>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </MainLayout>
  );
}
