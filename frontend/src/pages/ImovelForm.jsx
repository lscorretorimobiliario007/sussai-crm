import PropertyImages from "../components/property/PropertyImages";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Grid,
  MenuItem,
  Paper,
  Stack,
  Switch,
  FormControlLabel,
  Typography,
  CircularProgress,
} from "@mui/material";

import MainLayout from "../components/layout/MainLayout";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { useToast } from "../components/ui/Toast";
import api from "../api/axios";

const FINALIDADES = [
  { value: "VENDA", label: "Venda" },
  { value: "LOCACAO", label: "Locação" },
];

const TIPOS = [
  { value: "CASA", label: "Casa" },
  { value: "APARTAMENTO", label: "Apartamento" },
  { value: "TERRENO", label: "Terreno" },
  { value: "COMERCIAL", label: "Comercial" },
  { value: "RURAL", label: "Rural (indisponível)", disabled: true },
  { value: "SOBRADO", label: "Sobrado (indisponível)", disabled: true },
  { value: "CHACARA", label: "Chácara (indisponível)", disabled: true },
];

const initialState = {
  titulo: "",
  descricao: "",
  finalidade: "VENDA",
  tipo: "CASA",

  valorVenda: "",
  valorLocacao: "",

  endereco: "",
  numero: "",
  bairro: "",
  cidade: "",
  estado: "",
  cep: "",

  quartos: "",
  banheiros: "",
  suites: "",
  vagas: "",

  areaTerreno: "",
  areaConstruida: "",

  destaque: false,
  publicado: true,
};

export default function ImovelForm() {
  const navigate = useNavigate();
  const toast = useToast();

  const { id } = useParams();

  const editando = Boolean(id);

  const [loading, setLoading] = useState(editando);

  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState(initialState);

  const handleChange = (campo) => (event) => {
    const value =
      event.target.type === "checkbox"
        ? event.target.checked
        : event.target.value;

    setForm((old) => ({
      ...old,
      [campo]: value,
    }));
  };

  const carregarImovel = useCallback(async () => {
    try {
      setLoading(true);

      const { data } = await api.get(`/properties/${id}`);

      setForm({
        titulo: data.titulo ?? "",
        descricao: data.descricao ?? "",

        finalidade: data.finalidade,
        tipo: data.tipo,

        valorVenda: data.valorVenda ?? "",
        valorLocacao: data.valorLocacao ?? "",

        endereco: data.endereco ?? "",
        numero: data.numero ?? "",
        bairro: data.bairro ?? "",
        cidade: data.cidade ?? "",
        estado: data.estado ?? "",
        cep: data.cep ?? "",

        quartos: data.quartos ?? "",
        banheiros: data.banheiros ?? "",
        suites: data.suites ?? "",
        vagas: data.vagas ?? "",

        areaTerreno: data.areaTerreno ?? "",
        areaConstruida: data.areaConstruida ?? "",

        destaque: Boolean(data.destaque),
        publicado: Boolean(data.publicado),
      });
    } catch {
      toast.error("Erro ao carregar imóvel.");
      navigate("/imoveis");
    } finally {
      setLoading(false);
    }
  }, [id, navigate, toast]);

  useEffect(() => {
    if (!editando) return;
    carregarImovel();
  }, [carregarImovel, editando]);

  function montarPayload() {
    return {
      titulo: form.titulo,
      descricao: form.descricao,

      finalidade: form.finalidade,
      tipo: form.tipo,

      valorVenda:
        form.finalidade === "VENDA"
          ? Number(form.valorVenda)
          : null,

      valorLocacao:
        form.finalidade === "LOCACAO"
          ? Number(form.valorLocacao)
          : null,

      endereco: form.endereco,
      numero: form.numero,

      bairro: form.bairro,
      cidade: form.cidade,
      estado: form.estado,

      cep: form.cep,

      quartos: form.quartos ? Number(form.quartos) : null,
      banheiros: form.banheiros ? Number(form.banheiros) : null,
      suites: form.suites ? Number(form.suites) : null,
      vagas: form.vagas ? Number(form.vagas) : null,

      areaTerreno: form.areaTerreno
        ? Number(form.areaTerreno)
        : null,

      areaConstruida: form.areaConstruida
        ? Number(form.areaConstruida)
        : null,

      destaque: form.destaque,
      publicado: form.publicado,
    };
  }

 async function salvar() {
  try {
    setSaving(true);

    const payload = montarPayload();

    if (editando) {
      await api.patch(`/properties/${id}`, payload);
      toast.success("Imóvel atualizado com sucesso.");
      navigate(`/imoveis/${id}`);
    } else {
   const { data } = await api.post("/properties", payload);

toast.success("Imóvel cadastrado com sucesso.");

navigate(`/imoveis/${data.id}`);
  } 
}   catch (e) {
    const message = e.response?.data?.message || e.response?.data?.erro;
    toast.error(
      (Array.isArray(message) ? message.join(", ") : message) ||
      "Erro ao salvar."
    );
  } finally {
    setSaving(false);
  }
}

  if (loading) {
    return (
      <MainLayout title="Imóvel">
        <Box
          display="flex"
          justifyContent="center"
          mt={10}
        >
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      title={
        editando
          ? "Editar imóvel"
          : "Novo imóvel"
      }
    >
      <Paper sx={{ p: 4 }}>

        <Typography
          variant="h5"
          fontWeight={800}
          mb={3}
        >
          Dados do imóvel
        </Typography>
<Grid container spacing={2}>
              <Grid item xs={12}>
            <Input
              label="Título"
              value={form.titulo}
              onChange={handleChange("titulo")}
              required
              fullWidth
            />
          </Grid>

          <Grid item xs={12}>
            <Input
              label="Descrição"
              multiline
              rows={4}
              value={form.descricao}
              onChange={handleChange("descricao")}
              fullWidth
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Input
              select
              label="Finalidade"
              value={form.finalidade}
              onChange={handleChange("finalidade")}
              fullWidth
            >
              {FINALIDADES.map((item) => (
                <MenuItem key={item.value} value={item.value} disabled={item.disabled}>
                  {item.label}
                </MenuItem>
              ))}
            </Input>
          </Grid>

          <Grid item xs={12} md={6}>
            <Input
              select
              label="Tipo"
              value={form.tipo}
              onChange={handleChange("tipo")}
              fullWidth
            >
              {TIPOS.map((item) => (
                <MenuItem key={item.value} value={item.value} disabled={item.disabled}>
                  {item.label}
                </MenuItem>
              ))}
            </Input>
          </Grid>

          {form.finalidade === "VENDA" && (
            <Grid item xs={12} md={6}>
              <Input
                type="number"
                label="Valor de Venda"
                value={form.valorVenda}
                onChange={handleChange("valorVenda")}
                fullWidth
              />
            </Grid>
          )}

          {form.finalidade === "LOCACAO" && (
            <Grid item xs={12} md={6}>
              <Input
                type="number"
                label="Valor da Locação"
                value={form.valorLocacao}
                onChange={handleChange("valorLocacao")}
                fullWidth
              />
            </Grid>
          )}
          <Grid item xs={12}>
            <Typography
              variant="h6"
              sx={{ mt: 2 }}
            >
              Endereço
            </Typography>
          </Grid>

          <Grid item xs={12} md={3}>
            <Input
              label="CEP"
              value={form.cep}
              onChange={handleChange("cep")}
              fullWidth
            />
          </Grid>

          <Grid item xs={12} md={7}>
            <Input
              label="Endereço"
              value={form.endereco}
              onChange={handleChange("endereco")}
              fullWidth
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <Input
              label="Número"
              value={form.numero}
              onChange={handleChange("numero")}
              fullWidth
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Input
              label="Bairro"
              value={form.bairro}
              onChange={handleChange("bairro")}
              fullWidth
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Input
              label="Cidade"
              value={form.cidade}
              onChange={handleChange("cidade")}
              fullWidth
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Input
              label="Estado"
              value={form.estado}
              inputProps={{ maxLength: 2 }}
              onChange={handleChange("estado")}
              fullWidth
            />
          </Grid>

          <Grid item xs={12}>
            <Typography
              variant="h6"
              sx={{ mt: 2 }}
            >
              Características
            </Typography>
          </Grid>

          <Grid item xs={6} md={3}>
            <Input
              type="number"
              label="Quartos"
              value={form.quartos}
              onChange={handleChange("quartos")}
            />
          </Grid>

          <Grid item xs={6} md={3}>
            <Input
              type="number"
              label="Banheiros"
              value={form.banheiros}
              onChange={handleChange("banheiros")}
            />
          </Grid>

          <Grid item xs={6} md={3}>
            <Input
              type="number"
              label="Suítes"
              value={form.suites}
              onChange={handleChange("suites")}
            />
          </Grid>

          <Grid item xs={6} md={3}>
            <Input
              type="number"
              label="Vagas"
              value={form.vagas}
              onChange={handleChange("vagas")}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Input
              type="number"
              label="Área Terreno (m²)"
              value={form.areaTerreno}
              onChange={handleChange("areaTerreno")}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Input
              type="number"
              label="Área Construída (m²)"
              value={form.areaConstruida}
              onChange={handleChange("areaConstruida")}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography
              variant="h6"
              sx={{ mt: 2 }}
            >
              Publicação
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Stack direction="row" spacing={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.destaque}
                    onChange={handleChange("destaque")}
                  />
                }
                label="Destaque"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={form.publicado}
                    onChange={handleChange("publicado")}
                  />
                }
                label="Publicado"
              />
            </Stack>
          </Grid>
          {editando && (
  <Grid item xs={12}>
    <PropertyImages propertyId={id} title={form.titulo || "Imóvel"} />
  </Grid>
)}
                    <Grid item xs={12}>
            <Stack
              direction="row"
              justifyContent="flex-end"
              spacing={2}
              mt={2}
            >
              <Button
                color="inherit"
                onClick={() => navigate("/imoveis")}
              >
                Cancelar
              </Button>

             <Button
  variant="contained"
  onClick={salvar}
  disabled={saving}
>
                {saving
                  ? "Salvando..."
                  : editando
                  ? "Atualizar imóvel"
                  : "Cadastrar imóvel"}
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>
    </MainLayout>
  );
}