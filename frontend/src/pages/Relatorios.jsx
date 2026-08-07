import { useCallback, useEffect, useState } from "react";
import { Avatar, Box, Grid, Stack, Typography } from "@mui/material";
import {
  AssessmentOutlined,
  FileDownloadOutlined,
  PaymentsOutlined,
  TrendingUp,
} from "@mui/icons-material";
import MainLayout from "../components/layout/MainLayout";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Loading from "../components/ui/Loading";
import { useToast } from "../context/toast";
import { useAuth } from "../context/auth";
import api from "../api/axios";
import { formatCurrency } from "../utils/formatters";
import { downloadBlob } from "../utils/financeiro";
import { isManager } from "../utils/roles";

function ReportCard({ title, description, icon: Icon, color, actionLabel, onAction, loading }) {
  return (
    <Card sx={{ height: "100%" }}>
      <Stack spacing={2} sx={{ height: "100%" }}>
        <Avatar variant="rounded" sx={{ bgcolor: `${color}18`, color, width: 48, height: 48, borderRadius: 3 }}>
          <Icon />
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" fontWeight={800}>{title}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
            {description}
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<FileDownloadOutlined />} onClick={onAction} loading={loading}>
          {actionLabel}
        </Button>
      </Stack>
    </Card>
  );
}

export default function Relatorios() {
  const toast = useToast();
  const { usuario } = useAuth();
  const manager = isManager(usuario);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dashboardRes, financeiroRes] = await Promise.allSettled([
        api.get("/dashboard"),
        manager ? api.get("/financeiro/resumo") : Promise.resolve({ data: null }),
      ]);

      setSummary({
        dashboard: dashboardRes.status === "fulfilled" ? dashboardRes.value.data : null,
        financeiro: financeiroRes.status === "fulfilled" ? financeiroRes.value.data : null,
      });

      if (dashboardRes.status === "rejected" && financeiroRes.status === "rejected") {
        toast.error("Não foi possível carregar os resumos de relatório.");
      }
    } finally {
      setLoading(false);
    }
  }, [manager, toast]);

  useEffect(() => { load(); }, [load]);

  const exportFinanceiro = async (tipo) => {
    setBusy(tipo);
    try {
      const { data } = await api.get(`/financeiro/export/${tipo}`, { responseType: "blob" });
      downloadBlob(data, `financeiro.${tipo === "excel" ? "xlsx" : "pdf"}`);
      toast.success(`Exportação ${tipo.toUpperCase()} iniciada.`);
    } catch (error) {
      toast.error(error.response?.data?.erro || `Falha ao exportar ${tipo}.`);
    } finally {
      setBusy("");
    }
  };

  const dash = summary?.dashboard || {};
  const fin = summary?.financeiro || {};

  return (
    <MainLayout title="Relatórios">
      <Stack spacing={0.5} sx={{ mb: 2.5 }}>
        <Typography variant="h5" fontWeight={800}>Relatórios</Typography>
        <Typography variant="body2" color="text.secondary">
          Resumos operacionais e exportações rápidas.
        </Typography>
      </Stack>

      {loading ? (
        <Loading variant="skeleton" rows={4} />
      ) : (
        <>
          <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card premium>
                <Typography variant="body2" color="text.secondary">Imóveis</Typography>
                <Typography variant="h4" fontWeight={800}>{dash.totalImoveis ?? dash.imoveis ?? "—"}</Typography>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card premium>
                <Typography variant="body2" color="text.secondary">Leads</Typography>
                <Typography variant="h4" fontWeight={800}>{dash.totalLeads ?? dash.leads ?? "—"}</Typography>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card premium>
                <Typography variant="body2" color="text.secondary">Contratos</Typography>
                <Typography variant="h4" fontWeight={800}>{dash.totalContratos ?? dash.contratos ?? "—"}</Typography>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card premium>
                <Typography variant="body2" color="text.secondary">Receita</Typography>
                <Typography variant="h4" fontWeight={800}>
                  {formatCurrency(fin.receita ?? fin.totalReceitas ?? dash.receita)}
                </Typography>
              </Card>
            </Grid>
          </Grid>

          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, md: 4 }}>
              <ReportCard
                title="Resumo comercial"
                description="Indicadores de imóveis, leads e conversão do dashboard."
                icon={AssessmentOutlined}
                color="#2563eb"
                actionLabel="Atualizar resumo"
                onAction={load}
              />
            </Grid>
            {manager && (
              <>
                <Grid size={{ xs: 12, md: 4 }}>
                  <ReportCard
                    title="Financeiro Excel"
                    description="Exporta lançamentos e indicadores financeiros em planilha."
                    icon={PaymentsOutlined}
                    color="#0f766e"
                    actionLabel="Baixar Excel"
                    loading={busy === "excel"}
                    onAction={() => exportFinanceiro("excel")}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <ReportCard
                    title="Financeiro PDF"
                    description="Gera um relatório consolidado em PDF para compartilhamento."
                    icon={TrendingUp}
                    color="#d97706"
                    actionLabel="Baixar PDF"
                    loading={busy === "pdf"}
                    onAction={() => exportFinanceiro("pdf")}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </>
      )}
    </MainLayout>
  );
}
