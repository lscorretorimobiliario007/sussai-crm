import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Avatar, Box, Chip, Grid, LinearProgress, Stack, Typography } from "@mui/material";
import {
  ArrowBack, EditOutlined, EventAvailableOutlined, TrendingUp, UploadFileOutlined,
} from "@mui/icons-material";
import MainLayout from "../components/layout/MainLayout";
import AuthenticatedImage from "../components/imoveis/AuthenticatedImage";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Loading from "../components/ui/Loading";
import { useToast } from "../components/ui/Toast";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import { formatCurrency, formatDateTime } from "../utils/formatters";

const STATUS = {
  ATIVO: { label: "Ativo", color: "success" },
  FERIAS: { label: "Férias", color: "warning" },
  INATIVO: { label: "Inativo", color: "default" },
};

export default function CorretorDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { usuario } = useAuth();
  const canManage = ["ADMIN", "GERENTE"].includes(usuario?.tipo) || Number(usuario?.id) === Number(id);
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const response = await api.get(`/corretores/${id}`);
      setItem(response.data);
    } catch (error) {
      toast.error(error.response?.data?.erro || "Erro ao carregar corretor.");
      navigate("/corretores");
    } finally {
      setLoading(false);
    }
  }, [id, navigate, toast]);

  useEffect(() => { load(); }, [load]);

  const uploadFoto = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("foto", file);
    try {
      await api.post(`/corretores/${id}/foto`, formData);
      toast.success("Foto atualizada.");
      load();
    } catch (error) {
      toast.error(error.response?.data?.erro || "Erro ao enviar foto.");
    }
    event.target.value = "";
  };

  if (loading || !item) return <MainLayout title="Corretor"><Loading variant="skeleton" rows={8} /></MainLayout>;
  const status = STATUS[item.statusCorretor] || { label: item.statusCorretor, color: "default" };
  const ind = item.indicadores || {};

  return (
    <MainLayout title={item.nome}>
      <Stack spacing={3}>
        <Stack direction={{ xs: "column", lg: "row" }} justifyContent="space-between" gap={2}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box>
              <Button color="inherit" startIcon={<ArrowBack />} onClick={() => navigate("/corretores")}>Voltar</Button>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1.5 }}>
                {item.fotoUrl ? (
                  <AuthenticatedImage src={item.fotoUrl} alt={item.nome} sx={{ width: 84, height: 84, borderRadius: "50%" }} />
                ) : (
                  <Avatar sx={{ width: 84, height: 84, bgcolor: "primary.main", fontWeight: 850, fontSize: 32 }}>
                    {item.nome.slice(0, 1).toUpperCase()}
                  </Avatar>
                )}
                <Box>
                  <Chip size="small" label={status.label} color={status.color} sx={{ fontWeight: 750, mb: 0.75 }} />
                  <Typography variant="h4" fontWeight={900}>{item.nome}</Typography>
                  <Typography color="text.secondary">
                    CRECI {item.creci || "—"} · {item.equipe?.nome || "Sem equipe"} · {item.tipo}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {canManage && (
              <>
                <Button component="label" variant="outlined" startIcon={<UploadFileOutlined />}>
                  Foto
                  <input hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadFoto} />
                </Button>
                <Button variant="contained" startIcon={<EditOutlined />} onClick={() => navigate(`/corretores/${id}/editar`)}>Editar</Button>
              </>
            )}
          </Stack>
        </Stack>

        <Grid container spacing={2}>
          {[
            { label: "Vendas no mês", value: formatCurrency(ind.valorVendasMes) },
            { label: "Comissão prevista", value: formatCurrency(ind.comissaoPrevista) },
            { label: "Captações", value: ind.captacoes ?? 0 },
            { label: "Conversão", value: `${ind.conversao ?? 0}%` },
            { label: "Leads abertos", value: ind.leadsAbertos ?? 0 },
            { label: "Agenda no mês", value: ind.agendaMes ?? 0 },
          ].map((card) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, xl: 2 }} key={card.label}>
              <Card contentSx={{ p: 2 }}>
                <Typography variant="caption" color="text.secondary">{card.label}</Typography>
                <Typography variant="h6" fontWeight={850}>{card.value}</Typography>
              </Card>
            </Grid>
          ))}
        </Grid>

        {ind.metaMensal > 0 && (
          <Card>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography fontWeight={800}>Meta mensal · {formatCurrency(ind.metaMensal)}</Typography>
              <Typography fontWeight={750}>{ind.progressoMeta}%</Typography>
            </Stack>
            <LinearProgress variant="determinate" value={ind.progressoMeta || 0} sx={{ height: 12, borderRadius: 999 }} />
          </Card>
        )}

        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                <TrendingUp color="primary" fontSize="small" />
                <Typography variant="h6" fontWeight={800}>Pipeline</Typography>
              </Stack>
              {(item.leads || []).map((lead) => (
                <Box key={lead.id} sx={{ mb: 1, cursor: "pointer" }} onClick={() => navigate("/leads")}>
                  <Typography fontWeight={750} noWrap>{lead.titulo}</Typography>
                  <Typography variant="caption" color="text.secondary">{lead.etapa?.nome || lead.status}</Typography>
                </Box>
              ))}
              {(item.leads || []).length === 0 && <Typography color="text.secondary">Sem leads recentes.</Typography>}
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>Imóveis</Typography>
              {(item.imoveisCorretados || []).map((imovel) => (
                <Box key={imovel.id} sx={{ mb: 1, cursor: "pointer" }} onClick={() => navigate(`/imoveis/${imovel.id}`)}>
                  <Typography fontWeight={750} noWrap>{imovel.codigo} — {imovel.titulo}</Typography>
                  <Typography variant="caption" color="text.secondary">{imovel.status} · {formatCurrency(imovel.valorVenda || imovel.valorAluguel)}</Typography>
                </Box>
              ))}
              {(item.imoveisCorretados || []).length === 0 && <Typography color="text.secondary">Sem imóveis.</Typography>}
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                <EventAvailableOutlined color="primary" fontSize="small" />
                <Typography variant="h6" fontWeight={800}>Agenda</Typography>
              </Stack>
              {(item.eventosAgenda || []).map((evento) => (
                <Box key={evento.id} sx={{ mb: 1, cursor: "pointer" }} onClick={() => navigate("/agenda")}>
                  <Typography fontWeight={750} noWrap>{evento.titulo}</Typography>
                  <Typography variant="caption" color="text.secondary">{formatDateTime(evento.dataInicio)}</Typography>
                </Box>
              ))}
              {(item.eventosAgenda || []).length === 0 && <Typography color="text.secondary">Sem compromissos futuros.</Typography>}
            </Card>
          </Grid>
        </Grid>

        <Card>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>Histórico</Typography>
          <Stack spacing={1}>
            {(item.historicosCorretor || []).map((hist) => (
              <Box key={hist.id}>
                <Typography fontWeight={750}>{hist.acao}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {hist.autor?.nome} · {formatDateTime(hist.createdAt)}
                </Typography>
              </Box>
            ))}
            {(item.historicosCorretor || []).length === 0 && <Typography color="text.secondary">Sem histórico.</Typography>}
          </Stack>
        </Card>

        {(item.permissoes || []).length > 0 && (
          <Card>
            <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>Permissões</Typography>
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {item.permissoes.map((perm) => <Chip key={perm} label={perm} size="small" />)}
            </Stack>
          </Card>
        )}
      </Stack>
    </MainLayout>
  );
}
