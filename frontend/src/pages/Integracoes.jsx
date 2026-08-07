import { useCallback, useEffect, useState } from "react";
import {
  Chip,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { ExtensionOutlined } from "@mui/icons-material";
import MainLayout from "../components/layout/MainLayout";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import Loading from "../components/ui/Loading";
import { useToast } from "../context/toast";
import api from "../api/axios";
import { formatDateTime } from "../utils/formatters";

export default function Integracoes() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/integracoes");
      setItems(Array.isArray(data) ? data : data?.data || []);
    } catch (error) {
      setItems([]);
      toast.error(error.response?.data?.erro || error.response?.data?.message || "Erro ao carregar integrações.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const toggle = async (item) => {
    try {
      await api.patch(`/integracoes/${item.id}`, { ativo: !item.ativo });
      setItems((current) => current.map((row) => (
        row.id === item.id ? { ...row, ativo: !row.ativo } : row
      )));
      toast.success("Integração atualizada.");
    } catch (error) {
      toast.error(error.response?.data?.erro || "Não foi possível atualizar a integração.");
    }
  };

  return (
    <MainLayout title="Integrações">
      <Stack spacing={0.5} sx={{ mb: 2.5 }}>
        <Typography variant="h5" fontWeight={800}>Integrações</Typography>
        <Typography variant="body2" color="text.secondary">
          Conectores e provedores configurados para a imobiliária.
        </Typography>
      </Stack>

      <Card>
        {loading ? (
          <Loading variant="skeleton" rows={5} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={ExtensionOutlined}
            title="Nenhuma integração configurada"
            description="Quando houver provedores conectados, eles aparecerão aqui."
          />
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Provedor</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Atualizado em</TableCell>
                <TableCell align="right">Ativo</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>
                    <Typography fontWeight={700}>{item.provider || item.nome || "—"}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      color={item.ativo ? "success" : "default"}
                      label={item.ativo ? "Ativa" : "Inativa"}
                    />
                  </TableCell>
                  <TableCell>{formatDateTime(item.updatedAt || item.createdAt)}</TableCell>
                  <TableCell align="right">
                    <Switch checked={Boolean(item.ativo)} onChange={() => toggle(item)} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </MainLayout>
  );
}
