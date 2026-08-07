import { useCallback, useEffect, useState } from "react";
import {
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { HistoryEduOutlined } from "@mui/icons-material";
import MainLayout from "../components/layout/MainLayout";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import Loading from "../components/ui/Loading";
import { useToast } from "../context/toast";
import api from "../api/axios";
import { formatDateTime } from "../utils/formatters";

export default function Auditoria() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/auditoria");
      setItems(Array.isArray(data) ? data : data?.data || []);
    } catch (error) {
      setItems([]);
      toast.error(error.response?.data?.erro || error.response?.data?.message || "Erro ao carregar auditoria.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  return (
    <MainLayout title="Auditoria">
      <Stack spacing={0.5} sx={{ mb: 2.5 }}>
        <Typography variant="h5" fontWeight={800}>Trilha de auditoria</Typography>
        <Typography variant="body2" color="text.secondary">
          Registro de ações sensíveis realizadas no CRM.
        </Typography>
      </Stack>

      <Card>
        {loading ? (
          <Loading variant="skeleton" rows={6} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={HistoryEduOutlined}
            title="Sem registros de auditoria"
            description="Quando houver ações auditáveis, elas aparecerão nesta lista."
          />
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Data</TableCell>
                <TableCell>Usuário</TableCell>
                <TableCell>Ação</TableCell>
                <TableCell>Entidade</TableCell>
                <TableCell>IP</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>{formatDateTime(item.createdAt)}</TableCell>
                  <TableCell>{item.user?.nome || item.usuario?.nome || item.userId || "—"}</TableCell>
                  <TableCell><Chip size="small" label={item.action || item.acao || "—"} /></TableCell>
                  <TableCell>
                    {item.entity || item.entidade || "—"}
                    {item.entityId ? ` #${item.entityId}` : ""}
                  </TableCell>
                  <TableCell>{item.ip || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </MainLayout>
  );
}
