import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import {
  DoneAll,
  MarkEmailReadOutlined,
  NotificationsNoneOutlined,
  OpenInNew,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import Loading from "../components/ui/Loading";
import { useToast } from "../context/toast";
import api from "../api/axios";
import { formatDateTime } from "../utils/formatters";

async function fetchNotificacoes() {
  try {
    return await api.get("/notificacoes");
  } catch (error) {
    if (error.response?.status === 404) {
      return api.get("/agenda/notificacoes");
    }
    throw error;
  }
}

export default function Notificacoes() {
  const toast = useToast();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await fetchNotificacoes();
      const list = Array.isArray(data) ? data : data?.data || data?.notificacoes || [];
      setItems(list);
    } catch (error) {
      setItems([]);
      toast.error(error.response?.data?.erro || error.response?.data?.message || "Erro ao carregar notificações.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const marcarLida = async (item) => {
    try {
      const id = item.id;
      try {
        await api.patch(`/notificacoes/${id}/lida`);
      } catch {
        await api.patch(`/agenda/notificacoes/${id}/lida`);
      }
      setItems((current) => current.map((row) => (row.id === id ? { ...row, lida: true } : row)));
    } catch (error) {
      toast.error(error.response?.data?.erro || "Não foi possível marcar como lida.");
    }
  };

  const marcarTodas = async () => {
    try {
      try {
        await api.patch("/notificacoes/lidas");
      } catch {
        await api.patch("/agenda/notificacoes/lidas");
      }
      setItems((current) => current.map((row) => ({ ...row, lida: true })));
      toast.success("Todas as notificações foram marcadas como lidas.");
    } catch (error) {
      toast.error(error.response?.data?.erro || "Não foi possível atualizar as notificações.");
    }
  };

  const unread = items.filter((item) => !item.lida).length;

  return (
    <MainLayout title="Notificações">
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={1.5} sx={{ mb: 2.5 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>Central de notificações</Typography>
          <Typography variant="body2" color="text.secondary">
            {unread > 0 ? `${unread} não lida(s)` : "Você está em dia"}
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<DoneAll />} onClick={marcarTodas} disabled={!unread}>
          Marcar todas como lidas
        </Button>
      </Stack>

      <Card>
        {loading ? (
          <Loading variant="skeleton" rows={6} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={NotificationsNoneOutlined}
            title="Nenhuma notificação"
            description="Avisos de agenda, tarefas e sistema aparecerão aqui."
          />
        ) : (
          <List disablePadding>
            {items.map((item) => (
              <ListItem
                key={item.id}
                divider
                secondaryAction={
                  <Stack direction="row" spacing={0.5}>
                    {!item.lida && (
                      <IconButton edge="end" aria-label="Marcar como lida" onClick={() => marcarLida(item)}>
                        <MarkEmailReadOutlined fontSize="small" />
                      </IconButton>
                    )}
                    {item.link && (
                      <IconButton edge="end" aria-label="Abrir" onClick={() => navigate(item.link)}>
                        <OpenInNew fontSize="small" />
                      </IconButton>
                    )}
                  </Stack>
                }
                sx={{ bgcolor: item.lida ? "transparent" : "action.hover", borderRadius: 2, mb: 0.5 }}
              >
                <ListItemText
                  primary={(
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography fontWeight={item.lida ? 600 : 800}>
                        {item.title || item.titulo || "Notificação"}
                      </Typography>
                      {!item.lida && <Chip size="small" color="primary" label="Nova" />}
                    </Stack>
                  )}
                  secondary={(
                    <>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {item.body || item.mensagem || item.descricao || "—"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDateTime(item.createdAt || item.data)}
                      </Typography>
                    </>
                  )}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Card>
    </MainLayout>
  );
}
