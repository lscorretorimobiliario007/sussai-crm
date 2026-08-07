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
import { BackupOutlined, CloudUploadOutlined } from "@mui/icons-material";
import MainLayout from "../components/layout/MainLayout";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import Loading from "../components/ui/Loading";
import { useToast } from "../context/toast";
import api from "../api/axios";
import { formatDateTime } from "../utils/formatters";

const STATUS_COLOR = {
  PENDENTE: "warning",
  EM_ANDAMENTO: "info",
  CONCLUIDO: "success",
  FALHOU: "error",
};

export default function Backup() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/backup");
      setItems(Array.isArray(data) ? data : data?.data || []);
    } catch (error) {
      setItems([]);
      toast.error(error.response?.data?.erro || error.response?.data?.message || "Erro ao carregar backups.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const solicitar = async () => {
    setCreating(true);
    try {
      await api.post("/backup");
      toast.success("Backup solicitado.");
      await load();
    } catch (error) {
      toast.error(error.response?.data?.erro || "Não foi possível solicitar o backup.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <MainLayout title="Backup">
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1.5} sx={{ mb: 2.5 }}>
        <Stack spacing={0.5}>
          <Typography variant="h5" fontWeight={800}>Backup</Typography>
          <Typography variant="body2" color="text.secondary">
            Histórico e solicitações de cópia de segurança.
          </Typography>
        </Stack>
        <Button variant="contained" startIcon={<CloudUploadOutlined />} loading={creating} onClick={solicitar}>
          Solicitar backup
        </Button>
      </Stack>

      <Card>
        {loading ? (
          <Loading variant="skeleton" rows={5} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={BackupOutlined}
            title="Nenhum backup registrado"
            description="Solicite um backup para gerar a primeira cópia."
            actionLabel="Solicitar backup"
            onAction={solicitar}
          />
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Criado em</TableCell>
                <TableCell>Concluído em</TableCell>
                <TableCell>Arquivo</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>#{item.id}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      color={STATUS_COLOR[item.status] || "default"}
                      label={item.status || "—"}
                    />
                  </TableCell>
                  <TableCell>{formatDateTime(item.createdAt)}</TableCell>
                  <TableCell>{formatDateTime(item.completedAt)}</TableCell>
                  <TableCell>{item.filePath || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </MainLayout>
  );
}
