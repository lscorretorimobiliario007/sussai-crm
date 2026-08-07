import { useCallback, useEffect, useState } from "react";
import { Box, Chip, Grid, Stack, Typography } from "@mui/material";
import { ArrowBack, DeleteOutlined, EditOutlined } from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import PropertyImages from "../components/property/PropertyImages";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Loading from "../components/ui/Loading";
import { useToast } from "../context/toast";
import api from "../api/axios";
import { formatCurrency } from "../utils/formatters";
import { FINALIDADES_IMOVEL, TIPOS_IMOVEL, optionLabel } from "../utils/imoveis";

function Info({ label, value }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography fontWeight={700}>{value ?? "—"}</Typography>
    </Box>
  );
}

export default function ImovelDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/properties/${id}`);
      setProperty(data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Erro ao carregar imóvel.");
      navigate("/imoveis", { replace: true });
    } finally {
      setLoading(false);
    }
  }, [id, navigate, toast]);

  useEffect(() => { load(); }, [load]);

  const remove = async () => {
    setDeleting(true);
    try {
      await api.delete(`/properties/${id}`);
      toast.success("Imóvel desativado.");
      navigate("/imoveis", { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || "Erro ao desativar imóvel.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading || !property) {
    return <MainLayout title="Imóvel"><Loading variant="skeleton" rows={6} /></MainLayout>;
  }

  const price = property.finalidade === "LOCACAO" ? property.valorLocacao : property.valorVenda;
  const address = [property.endereco, property.numero, property.bairro, property.cidade, property.estado]
    .filter(Boolean)
    .join(", ");

  return (
    <MainLayout title="Detalhes do imóvel">
      <Stack spacing={3}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={2}>
          <Stack direction="row" spacing={1.5} alignItems="flex-start">
            <Button color="inherit" startIcon={<ArrowBack />} onClick={() => navigate("/imoveis")}>Voltar</Button>
            <Box>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip size="small" label={property.codigo} />
                <Chip size="small" color={property.publicado ? "success" : "default"} label={property.publicado ? "Publicado" : "Não publicado"} />
                {!property.ativo && <Chip size="small" color="warning" label="Inativo" />}
              </Stack>
              <Typography variant="h4" fontWeight={900} sx={{ mt: 1 }}>{property.titulo}</Typography>
              <Typography color="text.secondary">{address}</Typography>
            </Box>
          </Stack>
          {property.ativo && (
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" startIcon={<EditOutlined />} onClick={() => navigate(`/imoveis/${id}/editar`)}>Editar</Button>
              <Button color="error" variant="outlined" startIcon={<DeleteOutlined />} onClick={() => setConfirmOpen(true)}>Desativar</Button>
            </Stack>
          )}
        </Stack>

        <PropertyImages propertyId={property.id} title={property.titulo} readOnly={!property.ativo} />

        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Stack spacing={2.5}>
              <Card>
                <Typography variant="h6" sx={{ mb: 2 }}>Informações principais</Typography>
                <Grid container spacing={2.5}>
                  <Grid size={{ xs: 6, md: 3 }}><Info label="Finalidade" value={optionLabel(FINALIDADES_IMOVEL, property.finalidade)} /></Grid>
                  <Grid size={{ xs: 6, md: 3 }}><Info label="Tipo" value={optionLabel(TIPOS_IMOVEL, property.tipo)} /></Grid>
                  <Grid size={{ xs: 6, md: 3 }}><Info label="Valor" value={formatCurrency(price)} /></Grid>
                  <Grid size={{ xs: 6, md: 3 }}><Info label="Proprietário" value={property.proprietario?.nome} /></Grid>
                  <Grid size={{ xs: 6, md: 3 }}><Info label="Quartos" value={property.quartos} /></Grid>
                  <Grid size={{ xs: 6, md: 3 }}><Info label="Banheiros" value={property.banheiros} /></Grid>
                  <Grid size={{ xs: 6, md: 3 }}><Info label="Suítes" value={property.suites} /></Grid>
                  <Grid size={{ xs: 6, md: 3 }}><Info label="Vagas" value={property.vagas} /></Grid>
                  <Grid size={{ xs: 6, md: 3 }}><Info label="Área construída" value={property.areaConstruida ? `${property.areaConstruida} m²` : null} /></Grid>
                  <Grid size={{ xs: 6, md: 3 }}><Info label="Área do terreno" value={property.areaTerreno ? `${property.areaTerreno} m²` : null} /></Grid>
                  <Grid size={{ xs: 6, md: 3 }}><Info label="Destaque" value={property.destaque ? "Sim" : "Não"} /></Grid>
                  <Grid size={{ xs: 6, md: 3 }}><Info label="CEP" value={property.cep} /></Grid>
                </Grid>
              </Card>
              <Card>
                <Typography variant="h6" sx={{ mb: 1 }}>Descrição</Typography>
                <Typography color="text.secondary" sx={{ whiteSpace: "pre-line" }}>{property.descricao || "Nenhuma descrição informada."}</Typography>
              </Card>
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, lg: 4 }}>
            <Card>
              <Typography variant="h6" sx={{ mb: 2 }}>Endereço</Typography>
              <Stack spacing={1.5}>
                <Info label="Logradouro" value={[property.endereco, property.numero].filter(Boolean).join(", ")} />
                <Info label="Bairro" value={property.bairro} />
                <Info label="Cidade / UF" value={`${property.cidade} / ${property.estado}`} />
                <Info label="CEP" value={property.cep} />
              </Stack>
            </Card>
          </Grid>
        </Grid>
      </Stack>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={remove}
        loading={deleting}
        title="Desativar imóvel"
        description={`O imóvel “${property.titulo}” deixará de aparecer no catálogo ativo.`}
        confirmLabel="Desativar"
      />
    </MainLayout>
  );
}
