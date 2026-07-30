import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Box,
  Chip,
  Grid,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import {
  Apartment,
  ArrowForward,
  AttachMoney,
  AutoAwesome,
  Badge,
  Description,
  HomeWork,
  People,
  PersonPin,
  TaskAlt,
  TrendingUp,
  WarningAmber,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import Card from "../components/ui/Card";
import DataTable from "../components/ui/DataTable";
import EmptyState from "../components/ui/EmptyState";
import Loading from "../components/ui/Loading";
import Button from "../components/ui/Button";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { formatCurrency, formatDate, STATUS_COBRANCA, STATUS_LEAD } from "../utils/formatters";

const CHART_COLORS = ["#2563eb", "#7c3aed", "#f59e0b", "#14b8a6", "#ef4444", "#06b6d4", "#ec4899"];

function MetricCard({ title, value, subtitle, icon: Icon, color, premium }) {
  return (
    <Card
      premium={premium}
      sx={{
        height: "100%",
        overflow: "hidden",
        position: "relative",
        transition: "transform 200ms ease, box-shadow 200ms ease",
        "&:hover": { transform: "translateY(-4px)", boxShadow: "0 20px 42px rgba(15,23,42,.12)" },
      }}
    >
      <Box sx={{ position: "absolute", width: 120, height: 120, borderRadius: "50%", bgcolor: `${color}12`, right: -36, top: -42 }} />
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1.5}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" color="text.secondary" fontWeight={650}>{title}</Typography>
          <Typography variant="h4" sx={{ mt: 1, fontSize: { xs: 24, lg: 30 }, letterSpacing: "-.03em" }} noWrap>
            {value}
          </Typography>
          {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
        </Box>
        <Avatar variant="rounded" sx={{ width: 46, height: 46, borderRadius: 3, bgcolor: `${color}18`, color, flexShrink: 0 }}>
          <Icon />
        </Avatar>
      </Stack>
    </Card>
  );
}

function ProgressChart({ data, labelKey, valueKey }) {
  const max = Math.max(...data.map((item) => item[valueKey]), 1);

  if (!data.length) {
    return <EmptyState title="Sem dados neste período" description="Os indicadores aparecerão quando houver movimentação." />;
  }

  return (
    <Stack spacing={2.25} sx={{ mt: 2.5 }}>
      {data.map((item, index) => (
        <Box key={item[labelKey]}>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
            <Typography variant="body2" fontWeight={650}>{item[labelKey]}</Typography>
            <Typography variant="body2" color="text.secondary" fontWeight={700}>{item[valueKey]}</Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={(item[valueKey] / max) * 100}
            sx={{
              height: 10,
              borderRadius: 99,
              bgcolor: "action.hover",
              "& .MuiLinearProgress-bar": {
                bgcolor: CHART_COLORS[index % CHART_COLORS.length],
                borderRadius: 99,
                transition: "transform 480ms ease",
              },
            }}
          />
        </Box>
      ))}
    </Stack>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const isDemo = Boolean(usuario?.demo) || usuario?.email === "demo@sussai.com.br";

  const loadDashboard = useCallback(() => {
    setLoading(true);
    setError(false);
    api.get("/dashboard")
      .then((response) => setData(response.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  }, []);

  if (loading) {
    return (
      <MainLayout title="Dashboard">
        <Loading variant="skeleton" rows={6} />
      </MainLayout>
    );
  }

  if (error || !data) {
    return (
      <MainLayout title="Dashboard">
        <Card>
          <EmptyState
            title="Não foi possível carregar o dashboard"
            description="Verifique sua conexão e tente novamente."
            actionLabel="Tentar novamente"
            onAction={loadDashboard}
          />
        </Card>
      </MainLayout>
    );
  }

  const { resumo, leadsPorStatus, imoveisPorStatus, leadsRecentes, cobrancasProximas } = data;
  const leadsChart = leadsPorStatus.map((item) => ({ name: STATUS_LEAD[item.status]?.label || item.status, value: item._count }));
  const imoveisChart = imoveisPorStatus.map((item) => ({ name: item.status.replaceAll("_", " "), value: item._count }));
  const canSeeFinance = ["ADMIN", "GERENTE"].includes(usuario?.tipo);

  const metrics = [
    { title: "Imóveis ativos", value: resumo.totalImoveis, subtitle: `${resumo.imoveisDisponiveis} disponíveis`, icon: HomeWork, color: "#2563eb", premium: true },
    { title: "Clientes", value: resumo.totalClientes, subtitle: "base cadastrada", icon: People, color: "#7c3aed" },
    { title: "Proprietários", value: resumo.totalProprietarios ?? 0, subtitle: "captação e carteira", icon: PersonPin, color: "#0ea5e9" },
    { title: "Corretores", value: resumo.totalCorretores ?? 0, subtitle: "equipe ativa", icon: Badge, color: "#6366f1" },
    { title: "Leads ativos", value: resumo.leadsAtivos, subtitle: "oportunidades abertas", icon: TrendingUp, color: "#f59e0b", premium: true },
    { title: "Contratos ativos", value: resumo.contratosAtivos, subtitle: "operações vigentes", icon: Description, color: "#14b8a6" },
    ...(canSeeFinance ? [
      { title: "Receita no mês", value: formatCurrency(resumo.receitaMes), subtitle: "valores recebidos", icon: AttachMoney, color: "#16a34a", premium: true },
      { title: "A receber", value: formatCurrency(resumo.aReceber ?? 0), subtitle: "títulos em aberto", icon: AttachMoney, color: "#0ea5e9" },
      { title: "A pagar", value: formatCurrency(resumo.aPagar ?? 0), subtitle: "compromissos", icon: AttachMoney, color: "#f59e0b" },
      { title: "Comissões pendentes", value: formatCurrency(resumo.comissoesPendentes ?? 0), subtitle: "equipe comercial", icon: AttachMoney, color: "#8b5cf6" },
      { title: "Cobranças pendentes", value: resumo.cobrancasPendentes, subtitle: "aguardando pagamento", icon: WarningAmber, color: "#d97706" },
      { title: "Inadimplentes", value: resumo.cobrancasAtrasadas, subtitle: "requerem atenção", icon: WarningAmber, color: "#dc2626" },
    ] : []),
    { title: "Tarefas pendentes", value: resumo.tarefasPendentes, subtitle: "itens para concluir", icon: TaskAlt, color: "#0f766e" },
  ];

  const leadColumns = [
    { key: "titulo", label: "Oportunidade", render: (row) => <Typography variant="body2" fontWeight={700}>{row.titulo}</Typography> },
    { key: "cliente", label: "Cliente", render: (row) => row.cliente?.nome || "—" },
    { key: "status", label: "Etapa", render: (row) => (
      <Chip
        label={row.etapa?.nome || STATUS_LEAD[row.status]?.label || row.status}
        size="small"
        sx={row.etapa?.cor ? { bgcolor: row.etapa.cor, color: "#fff", fontWeight: 750 } : undefined}
        color={!row.etapa?.cor && row.status === "FECHADO" ? "success" : "default"}
      />
    ) },
    { key: "corretor", label: "Responsável", render: (row) => row.corretor?.nome || "—" },
  ];

  const billingColumns = [
    { key: "contrato", label: "Contrato", render: (row) => row.contrato?.numero || "—" },
    { key: "cliente", label: "Cliente", render: (row) => row.contrato?.cliente?.nome || "—" },
    { key: "valor", label: "Valor", render: (row) => <Typography fontWeight={700}>{formatCurrency(row.valor)}</Typography> },
    { key: "vencimento", label: "Vencimento", render: (row) => formatDate(row.vencimento) },
    { key: "status", label: "Status", render: (row) => <Chip label={STATUS_COBRANCA[row.status]?.label || row.status} color={STATUS_COBRANCA[row.status]?.color} size="small" /> },
  ];

  return (
    <MainLayout title="Dashboard">
      {isDemo && (
        <Card
          premium
          sx={{
            mb: 3,
            overflow: "hidden",
            position: "relative",
            background: (theme) => theme.palette.mode === "dark"
              ? "linear-gradient(135deg, rgba(37,99,235,.28), rgba(15,118,110,.18))"
              : "linear-gradient(135deg, #eff6ff 0%, #ecfeff 55%, #f8fafc 100%)",
          }}
        >
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }} spacing={2}>
            <Box>
              <Chip icon={<AutoAwesome />} label="Ambiente de demonstração" size="small" color="primary" sx={{ mb: 1.5, fontWeight: 750 }} />
              <Typography variant="h4" sx={{ letterSpacing: "-.03em" }}>
                SUSSAI em ação
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.75, maxWidth: 560 }}>
                Dados fictícios realistas para apresentar Imóveis, Pipeline, Agenda, Proprietários, Corretores e Financeiro com impacto.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1.25} flexWrap="wrap" useFlexGap>
              <Button variant="contained" onClick={() => navigate("/leads")}>Ver pipeline</Button>
              <Button variant="outlined" onClick={() => navigate("/financeiro")}>Ver financeiro</Button>
            </Stack>
          </Stack>
        </Card>
      )}

      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }} spacing={2} sx={{ mb: 3.5 }}>
        <Box>
          <Typography variant="h4">{greeting}, {usuario?.nome?.split(" ")[0]}.</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            {isDemo ? "Painel executivo com métricas de demonstração." : "Aqui está o pulso da sua imobiliária hoje."}
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Apartment />} onClick={() => navigate("/imoveis")}>Novo imóvel</Button>
      </Stack>

      <Grid container spacing={2.25} data-tour="dashboard-metrics">
        {metrics.map((metric) => (
          <Grid key={metric.title} size={{ xs: 12, sm: 6, lg: 3 }}>
            <MetricCard {...metric} />
          </Grid>
        ))}

        <Grid size={{ xs: 12, lg: 6 }}>
          <Card premium sx={{ height: "100%" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h6">Pipeline de vendas</Typography>
                <Typography variant="body2" color="text.secondary">Distribuição das oportunidades</Typography>
              </Box>
              <Button variant="text" endIcon={<ArrowForward />} onClick={() => navigate("/leads")}>Ver CRM</Button>
            </Stack>
            <ProgressChart data={leadsChart} labelKey="name" valueKey="value" />
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <Card premium sx={{ height: "100%" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h6">Portfólio de imóveis</Typography>
                <Typography variant="body2" color="text.secondary">Distribuição por status</Typography>
              </Box>
              <Button variant="text" endIcon={<ArrowForward />} onClick={() => navigate("/imoveis")}>Ver imóveis</Button>
            </Stack>
            <ProgressChart data={imoveisChart} labelKey="name" valueKey="value" />
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Card>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h6">Proprietários</Typography>
                <Typography variant="body2" color="text.secondary">Captação e carteira vinculada</Typography>
              </Box>
              <Button variant="text" endIcon={<ArrowForward />} onClick={() => navigate("/proprietarios")}>Abrir</Button>
            </Stack>
            <Typography variant="h3" sx={{ mt: 2, letterSpacing: "-.04em" }}>{resumo.totalProprietarios ?? 0}</Typography>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Card>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h6">Corretores</Typography>
                <Typography variant="body2" color="text.secondary">Performance e ranking</Typography>
              </Box>
              <Button variant="text" endIcon={<ArrowForward />} onClick={() => navigate("/corretores")}>Abrir</Button>
            </Stack>
            <Typography variant="h3" sx={{ mt: 2, letterSpacing: "-.04em" }}>{resumo.totalCorretores ?? 0}</Typography>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, xl: canSeeFinance ? 6 : 12 }}>
          <Card>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Box>
                <Typography variant="h6">Leads recentes</Typography>
                <Typography variant="body2" color="text.secondary">Últimas oportunidades atualizadas</Typography>
              </Box>
              <Button variant="text" onClick={() => navigate("/leads")}>Ver todos</Button>
            </Stack>
            {leadsRecentes?.length ? (
              <DataTable columns={leadColumns} rows={leadsRecentes} />
            ) : (
              <EmptyState title="Nenhum lead recente" description="Crie oportunidades no Pipeline CRM." actionLabel="Abrir pipeline" onAction={() => navigate("/leads")} />
            )}
          </Card>
        </Grid>

        {canSeeFinance && (
          <Grid size={{ xs: 12, xl: 6 }}>
            <Card>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Box>
                  <Typography variant="h6">Próximas cobranças</Typography>
                  <Typography variant="body2" color="text.secondary">Compromissos financeiros mais próximos</Typography>
                </Box>
                <Button variant="text" onClick={() => navigate("/financeiro")}>Ver financeiro</Button>
              </Stack>
              {cobrancasProximas?.length ? (
                <DataTable columns={billingColumns} rows={cobrancasProximas} />
              ) : (
                <EmptyState title="Sem cobranças próximas" description="Gere cobranças a partir dos contratos ativos." actionLabel="Abrir financeiro" onAction={() => navigate("/financeiro")} />
              )}
            </Card>
          </Grid>
        )}
      </Grid>
    </MainLayout>
  );
}
