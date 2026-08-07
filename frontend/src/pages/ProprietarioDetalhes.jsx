import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Box, Grid, Stack, Typography } from "@mui/material";
import { ArrowBack, EditOutlined, HomeWorkOutlined } from "@mui/icons-material";
import MainLayout from "../components/layout/MainLayout";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Loading from "../components/ui/Loading";
import { useToast } from "../context/toast";
import api from "../api/axios";
import { formatCurrency } from "../utils/formatters";
import { formatCnpj, formatCpf, formatPhone } from "../utils/clientes";
import { formatCep } from "../utils/cep";
import { getPropertyOwnerError } from "../utils/proprietarios";

function Field({ label, value }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography fontWeight={750}>{value || "—"}</Typography>
    </Box>
  );
}

export default function ProprietarioDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const response = await api.get(`/proprietarios/${id}`);
      setItem(response.data);
    } catch (error) {
      toast.error(getPropertyOwnerError(error, "Erro ao carregar proprietário."));
      navigate("/proprietarios");
    } finally {
      setLoading(false);
    }
  }, [id, navigate, toast]);

  useEffect(() => { load(); }, [load]);

  if (loading || !item) return <MainLayout title="Proprietário"><Loading variant="skeleton" rows={8} /></MainLayout>;

  const dash = item.dashboard || {};
  const address = [
    item.rua,
    item.numero,
    item.complemento,
    item.bairro,
    item.cidade,
    item.estado,
  ].filter(Boolean).join(", ");

  return (
    <MainLayout title={item.nome}>
      <Stack spacing={3}>
        <Stack direction={{ xs: "column", lg: "row" }} justifyContent="space-between" gap={2}>
          <Box>
            <Button color="inherit" startIcon={<ArrowBack />} onClick={() => navigate("/proprietarios")}>Voltar</Button>
            <Typography variant="h4" fontWeight={900} sx={{ mt: 1.5 }}>{item.nome}</Typography>
            <Typography color="text.secondary">
              {item.ativo === false ? "Inativo" : "Ativo"} · {item.email || "Sem e-mail"}
            </Typography>
          </Box>
          {item.ativo !== false && (
            <Button variant="contained" startIcon={<EditOutlined />} onClick={() => navigate(`/proprietarios/${id}/editar`)}>Editar</Button>
          )}
        </Stack>

        <Grid container spacing={2}>
          {[
            { label: "Imóveis", value: dash.imoveis ?? 0 },
            { label: "Contratos ativos", value: dash.contratosAtivos ?? 0 },
            { label: "Valor venda", value: formatCurrency(dash.valorVenda) },
            { label: "Valor aluguel", value: formatCurrency(dash.valorAluguel) },
          ].map((card) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={card.label}>
              <Card contentSx={{ p: 2 }}>
                <Typography variant="caption" color="text.secondary">{card.label}</Typography>
                <Typography variant="h6" fontWeight={850}>{card.value}</Typography>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, lg: 7 }}>
            <Stack spacing={2.5}>
              <Card>
                <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>Dados cadastrais</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}><Field label="CPF" value={item.cpf ? formatCpf(item.cpf) : null} /></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><Field label="CNPJ" value={item.cnpj ? formatCnpj(item.cnpj) : null} /></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><Field label="RG" value={item.rg} /></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><Field label="E-mail" value={item.email} /></Grid>
                </Grid>
              </Card>

              <Card>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <HomeWorkOutlined color="primary" />
                  <Typography variant="h6" fontWeight={800}>Imóveis vinculados</Typography>
                </Stack>
                <Stack spacing={1}>
                  {(item.properties || []).map((property) => (
                    <Box key={property.id} sx={{ cursor: "pointer" }} onClick={() => navigate(`/imoveis/${property.id}`)}>
                      <Typography fontWeight={750}>{property.codigo} — {property.titulo}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {[property.cidade, formatCurrency(property.valorVenda || property.valorLocacao)].filter(Boolean).join(" · ")}
                      </Typography>
                    </Box>
                  ))}
                  {(item.properties || []).length === 0 && <Typography color="text.secondary">Nenhum imóvel vinculado.</Typography>}
                </Stack>
              </Card>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, lg: 5 }}>
            <Stack spacing={2.5}>
              <Card>
                <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>Contatos</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6, lg: 12 }}><Field label="Telefone" value={item.telefone ? formatPhone(item.telefone) : null} /></Grid>
                  <Grid size={{ xs: 12, sm: 6, lg: 12 }}><Field label="Celular" value={item.celular ? formatPhone(item.celular) : null} /></Grid>
                  <Grid size={{ xs: 12, sm: 6, lg: 12 }}><Field label="WhatsApp" value={item.whatsapp ? formatPhone(item.whatsapp) : null} /></Grid>
                </Grid>
              </Card>

              <Card>
                <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>Endereço</Typography>
                <Stack spacing={2}>
                  <Field label="CEP" value={item.cep ? formatCep(item.cep) : null} />
                  <Field label="Endereço completo" value={address} />
                </Stack>
              </Card>

              <Card>
                <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>Observações</Typography>
                <Typography sx={{ whiteSpace: "pre-wrap" }}>{item.observacoes || "Nenhuma observação."}</Typography>
              </Card>
            </Stack>
          </Grid>
        </Grid>
      </Stack>
    </MainLayout>
  );
}
