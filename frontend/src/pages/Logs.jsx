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
import { TerminalOutlined } from "@mui/icons-material";
import MainLayout from "../components/layout/MainLayout";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import Loading from "../components/ui/Loading";
import Select from "../components/ui/Select";
import { useToast } from "../context/toast";
import api from "../api/axios";
import { formatDateTime } from "../utils/formatters";

const LEVEL_COLOR = {
  DEBUG: "default",
  INFO: "info",
  WARN: "warning",
  ERROR: "error",
};

export default function Logs() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [level, setLevel] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (level) params.level = level;
      const { data } = await api.get("/logs", { params });
      setItems(Array.isArray(data) ? data : data?.data || []);
    } catch (error) {
      setItems([]);
      toast.error(error.response?.data?.erro || error.response?.data?.message || "Erro ao carregar logs.");
    } finally {
      setLoading(false);
    }
  }, [level, toast]);

  useEffect(() => { load(); }, [load]);

  return (
    <MainLayout title="Logs">
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1.5} sx={{ mb: 2.5 }}>
        <Stack spacing={0.5}>
          <Typography variant="h5" fontWeight={800}>Logs do sistema</Typography>
          <Typography variant="body2" color="text.secondary">
            Eventos técnicos e diagnósticos da aplicação.
          </Typography>
        </Stack>
        <Select
          label="Nível"
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          options={[
            { value: "", label: "Todos" },
            { value: "DEBUG", label: "Debug" },
            { value: "INFO", label: "Info" },
            { value: "WARN", label: "Warn" },
            { value: "ERROR", label: "Error" },
          ]}
          sx={{ minWidth: 160 }}
        />
      </Stack>

      <Card>
        {loading ? (
          <Loading variant="skeleton" rows={6} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={TerminalOutlined}
            title="Nenhum log encontrado"
            description="Ajuste o filtro ou aguarde novos eventos do sistema."
          />
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Data</TableCell>
                <TableCell>Nível</TableCell>
                <TableCell>Mensagem</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDateTime(item.createdAt)}</TableCell>
                  <TableCell>
                    <Chip size="small" color={LEVEL_COLOR[item.level] || "default"} label={item.level || "—"} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{item.message || item.mensagem || "—"}</Typography>
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
