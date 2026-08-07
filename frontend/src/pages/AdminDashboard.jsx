import { useCallback, useEffect, useState } from "react";
import { Avatar, Box, Grid, Stack, Typography } from "@mui/material";
import {
  Apartment,
  PeopleAltOutlined,
  StorageOutlined,
  TrendingUp,
} from "@mui/icons-material";
import MainLayout from "../components/layout/MainLayout";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import Loading from "../components/ui/Loading";
import { useToast } from "../context/toast";
import api from "../api/axios";
import { formatCurrency } from "../utils/formatters";

function Metric({ title, value, icon: Icon, color }) {
  return (
    <Card premium sx={{ height: "100%" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="body2" color="text.secondary" fontWeight={650}>{title}</Typography>
          <Typography variant="h4" sx={{ mt: 1, letterSpacing: "-.03em" }}>{value}</Typography>
        </Box>
        <Avatar variant="rounded" sx={{ bgcolor: `${color}18`, color, width: 46, height: 46, borderRadius: 3 }}>
          <Icon />
        </Avatar>
      </Stack>
    </Card>
  );
}

function formatValue(value) {
  if (value == null) return "—";
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : formatCurrency(value);
  return String(value);
}

export default function AdminDashboard() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/admin/dashboard");
      setData(response.data);
    } catch (error) {
      setData(null);
      toast.error(error.response?.data?.erro || error.response?.data?.message || "Erro ao carregar painel admin.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const metrics = [
    { title: "Empresas", value: data?.empresas ?? data?.totalEmpresas, icon: Apartment, color: "#2563eb" },
    { title: "Usuários", value: data?.usuarios ?? data?.totalUsuarios, icon: PeopleAltOutlined, color: "#0f766e" },
    { title: "Imóveis", value: data?.imoveis ?? data?.totalImoveis, icon: StorageOutlined, color: "#7c3aed" },
    { title: "Receita", value: data?.receita ?? data?.faturamento, icon: TrendingUp, color: "#d97706" },
  ];

  return (
    <MainLayout title="Admin">
      <Stack spacing={0.5} sx={{ mb: 2.5 }}>
        <Typography variant="h5" fontWeight={800}>Painel administrativo</Typography>
        <Typography variant="body2" color="text.secondary">
          Visão consolidada da plataforma SUSSAI.
        </Typography>
      </Stack>

      {loading ? (
        <Loading variant="skeleton" rows={4} />
      ) : !data ? (
        <Card>
          <EmptyState
            title="Painel indisponível"
            description="Não foi possível obter os indicadores administrativos."
            actionLabel="Tentar novamente"
            onAction={load}
          />
        </Card>
      ) : (
        <Grid container spacing={2.5}>
          {metrics.map((item) => (
            <Grid key={item.title} size={{ xs: 12, sm: 6, md: 3 }}>
              <Metric title={item.title} value={formatValue(item.value)} icon={item.icon} color={item.color} />
            </Grid>
          ))}
          {data.resumo && (
            <Grid size={{ xs: 12 }}>
              <Card>
                <Typography variant="h6" fontWeight={800} gutterBottom>Resumo</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
                  {typeof data.resumo === "string" ? data.resumo : JSON.stringify(data.resumo, null, 2)}
                </Typography>
              </Card>
            </Grid>
          )}
        </Grid>
      )}
    </MainLayout>
  );
}
