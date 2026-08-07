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
import { DescriptionOutlined } from "@mui/icons-material";
import MainLayout from "../components/layout/MainLayout";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import Loading from "../components/ui/Loading";
import { useToast } from "../context/toast";
import api from "../api/axios";
import { formatDateTime } from "../utils/formatters";

function formatSize(bytes) {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Documentos() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/documentos");
      setItems(Array.isArray(data) ? data : data?.data || []);
    } catch (error) {
      setItems([]);
      toast.error(error.response?.data?.erro || error.response?.data?.message || "Erro ao carregar documentos.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  return (
    <MainLayout title="Documentos">
      <Stack spacing={0.5} sx={{ mb: 2.5 }}>
        <Typography variant="h5" fontWeight={800}>Documentos</Typography>
        <Typography variant="body2" color="text.secondary">
          Arquivos centralizados da imobiliária.
        </Typography>
      </Stack>

      <Card>
        {loading ? (
          <Loading variant="skeleton" rows={6} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={DescriptionOutlined}
            title="Nenhum documento"
            description="Os arquivos enviados pelo time aparecerão nesta lista."
          />
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Entidade</TableCell>
                <TableCell>Tamanho</TableCell>
                <TableCell>Enviado em</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>
                    <Typography fontWeight={700}>{item.nome || item.name || "—"}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.uploadedBy?.nome || item.uploadedById ? `Por #${item.uploadedById}` : ""}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip size="small" variant="outlined" label={item.mimeType || "arquivo"} />
                  </TableCell>
                  <TableCell>
                    {item.entityType || "—"}
                    {item.entityId ? ` #${item.entityId}` : ""}
                  </TableCell>
                  <TableCell>{formatSize(item.size)}</TableCell>
                  <TableCell>{formatDateTime(item.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </MainLayout>
  );
}
