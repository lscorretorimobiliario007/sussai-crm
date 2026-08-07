import PropertyImages from "../components/property/PropertyImages";
import PropertyOwnerSelector from "../components/property/PropertyOwnerSelector";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  CircularProgress,
  Grid,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Switch,
  FormControlLabel,
  Typography,
} from "@mui/material";

import MainLayout from "../components/layout/MainLayout";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { useToast } from "../context/toast";
import api from "../api/axios";
import { buscarCep, formatCep } from "../utils/cep";

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

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatCurrencyInput(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (!digits) return "";
  return currencyFormatter.format(Number(digits) / 100);
}

function formatCurrencyFromNumber(value) {
  if (value === null || value === undefined || value === "") return "";
  return currencyFormatter.format(Number(value));
}

function parseCurrency(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits ? Number(digits) / 100 : null;
}

function formatAreaInput(value) {
  const normalized = String(value ?? "")
    .replace(".", ",")
    .replace(/[^\d,]/g, "");
  const [integer = "", ...decimalParts] = normalized.split(",");
  const decimals = decimalParts.join("").slice(0, 2);
  return decimalParts.length > 0 ? `${integer},${decimals}` : integer;
}

function formatAreaFromNumber(value) {
  if (value === null || value === undefined || value === "") return "";
  return String(value).replace(".", ",");
}

function parseArea(value) {
  if (!String(value ?? "").trim()) return null;
  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function formatStateInput(value) {
  return String(value ?? "").replace(/[^a-z]/gi, "").slice(0, 2).toUpperCase();
}

const initialState = {
  proprietarioId: null,
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
  const [cepLoading, setCepLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const cepRequestRef = useRef(0);

  const [form, setForm] = useState(initialState);
  const [selectedOwner, setSelectedOwner] = useState(null);

  const handleChange = (campo) => (event) => {
    const value =
      event.target.type === "checkbox"
        ? event.target.checked
        : event.target.value;

    setForm((old) => ({
      ...old,
      [campo]: value,
    }));
    setErrors((current) => ({ ...current, [campo]: undefined }));
  };

  const handleMaskedChange = (campo, formatter) => (event) => {
    const value = formatter(event.target.value);
    setForm((old) => ({ ...old, [campo]: value }));
    setErrors((current) => ({ ...current, [campo]: undefined }));
  };

  const consultarCep = async (digits) => {
    const requestId = ++cepRequestRef.current;
    setCepLoading(true);
    setErrors((current) => ({ ...current, cep: undefined }));

    try {
      const data = await buscarCep(digits);
      if (requestId !== cepRequestRef.current) return;

      if (!data) {
        setErrors((current) => ({ ...current, cep: "CEP não encontrado." }));
        toast.error("CEP não encontrado. Confira os números e tente novamente.");
        return;
      }

      setForm((current) => ({
        ...current,
        cep: formatCep(data.cep),
        endereco: data.rua || current.endereco,
        bairro: data.bairro || current.bairro,
        cidade: data.cidade || current.cidade,
        estado: data.estado || current.estado,
      }));
      setErrors((current) => ({
        ...current,
        cep: undefined,
        endereco: undefined,
        bairro: undefined,
        cidade: undefined,
        estado: undefined,
      }));
    } catch {
      if (requestId !== cepRequestRef.current) return;
      setErrors((current) => ({
        ...current,
        cep: "Não foi possível consultar o CEP.",
      }));
      toast.error("Não foi possível consultar o CEP. Preencha o endereço manualmente.");
    } finally {
      if (requestId === cepRequestRef.current) setCepLoading(false);
    }
  };

  const handleCepChange = (event) => {
    const value = formatCep(event.target.value);
    const digits = value.replace(/\D/g, "");
    setForm((old) => ({ ...old, cep: value }));
    setErrors((current) => ({ ...current, cep: undefined }));

    if (digits.length === 8) {
      consultarCep(digits);
    } else {
      cepRequestRef.current += 1;
      setCepLoading(false);
    }
  };

  const carregarImovel = useCallback(async () => {
    try {
      setLoading(true);

      const { data } = await api.get(`/properties/${id}`);

      setForm({
        proprietarioId: data.proprietarioId ?? data.proprietario?.id ?? null,
        titulo: data.titulo ?? "",
        descricao: data.descricao ?? "",

        finalidade: data.finalidade,
        tipo: data.tipo,

        valorVenda: formatCurrencyFromNumber(data.valorVenda),
        valorLocacao: formatCurrencyFromNumber(data.valorLocacao),

        endereco: data.endereco ?? "",
        numero: data.numero ?? "",
        bairro: data.bairro ?? "",
        cidade: data.cidade ?? "",
        estado: data.estado ?? "",
        cep: formatCep(data.cep ?? ""),

        quartos: data.quartos ?? "",
        banheiros: data.banheiros ?? "",
        suites: data.suites ?? "",
        vagas: data.vagas ?? "",

        areaTerreno: formatAreaFromNumber(data.areaTerreno),
        areaConstruida: formatAreaFromNumber(data.areaConstruida),

        destaque: Boolean(data.destaque),
        publicado: Boolean(data.publicado),
      });
      setSelectedOwner(data.proprietario || null);
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
      proprietarioId: form.proprietarioId,
      titulo: form.titulo,
      descricao: form.descricao,

      finalidade: form.finalidade,
      tipo: form.tipo,

      valorVenda:
        form.finalidade === "VENDA"
          ? parseCurrency(form.valorVenda)
          : null,

      valorLocacao:
        form.finalidade === "LOCACAO"
          ? parseCurrency(form.valorLocacao)
          : null,

      endereco: form.endereco,
      numero: form.numero,

      bairro: form.bairro,
      cidade: form.cidade,
      estado: form.estado,

      cep: form.cep.replace(/\D/g, "") || null,

      quartos: form.quartos ? Number(form.quartos) : null,
      banheiros: form.banheiros ? Number(form.banheiros) : null,
      suites: form.suites ? Number(form.suites) : null,
      vagas: form.vagas ? Number(form.vagas) : null,

      areaTerreno: form.areaTerreno
        ? parseArea(form.areaTerreno)
        : null,

      areaConstruida: form.areaConstruida
        ? parseArea(form.areaConstruida)
        : null,

      destaque: form.destaque,
      publicado: form.publicado,
    };
  }

  function validarFormulario() {
    const nextErrors = {};
    const requiredFields = {
      proprietarioId: "Selecione o proprietário.",
      titulo: "Informe o título.",
      endereco: "Informe a rua.",
      bairro: "Informe o bairro.",
      cidade: "Informe a cidade.",
      estado: "Informe o estado.",
    };

    Object.entries(requiredFields).forEach(([field, message]) => {
      if (!String(form[field] ?? "").trim()) nextErrors[field] = message;
    });

    if (form.estado.trim().length !== 2) {
      nextErrors.estado = "Informe a UF com 2 letras.";
    }

    const cepDigits = form.cep.replace(/\D/g, "");
    if (form.cep && cepDigits.length !== 8) {
      nextErrors.cep = "Informe um CEP com 8 números.";
    }

    const valueField = form.finalidade === "VENDA" ? "valorVenda" : "valorLocacao";
    if (!(parseCurrency(form[valueField]) > 0)) {
      nextErrors[valueField] =
        form.finalidade === "VENDA"
          ? "Informe o valor de venda."
          : "Informe o valor de locação.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.error("Revise os campos obrigatórios destacados.");
      return false;
    }
    return true;
  }

 async function salvar() {
  if (!validarFormulario()) return;

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
          <Grid size={{ xs: 12 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Proprietário
            </Typography>
            <PropertyOwnerSelector
              owner={selectedOwner}
              onChange={(owner) => {
                setSelectedOwner(owner);
                setForm((current) => ({
                  ...current,
                  proprietarioId: owner?.id ?? null,
                }));
                setErrors((current) => ({
                  ...current,
                  proprietarioId: undefined,
                }));
              }}
              error={Boolean(errors.proprietarioId)}
              helperText={errors.proprietarioId}
            />
          </Grid>

              <Grid item xs={12}>
            <Input
              label="Título"
              value={form.titulo}
              onChange={handleChange("titulo")}
              required
              error={Boolean(errors.titulo)}
              helperText={errors.titulo}
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
                label="Valor de Venda"
                value={form.valorVenda}
                onChange={handleMaskedChange("valorVenda", formatCurrencyInput)}
                inputProps={{ inputMode: "numeric" }}
                required
                error={Boolean(errors.valorVenda)}
                helperText={errors.valorVenda}
                fullWidth
              />
            </Grid>
          )}

          {form.finalidade === "LOCACAO" && (
            <Grid item xs={12} md={6}>
              <Input
                label="Valor da Locação"
                value={form.valorLocacao}
                onChange={handleMaskedChange("valorLocacao", formatCurrencyInput)}
                inputProps={{ inputMode: "numeric" }}
                required
                error={Boolean(errors.valorLocacao)}
                helperText={errors.valorLocacao}
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
              onChange={handleCepChange}
              inputProps={{ inputMode: "numeric", maxLength: 9 }}
              InputProps={{
                endAdornment: cepLoading ? (
                  <InputAdornment position="end">
                    <CircularProgress size={18} />
                  </InputAdornment>
                ) : null,
              }}
              error={Boolean(errors.cep)}
              helperText={
                errors.cep ||
                (cepLoading ? "Consultando CEP..." : "Digite os 8 números para buscar")
              }
              fullWidth
            />
          </Grid>

          <Grid item xs={12} md={7}>
            <Input
              label="Rua"
              value={form.endereco}
              onChange={handleChange("endereco")}
              required
              error={Boolean(errors.endereco)}
              helperText={errors.endereco}
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
              required
              error={Boolean(errors.bairro)}
              helperText={errors.bairro}
              fullWidth
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Input
              label="Cidade"
              value={form.cidade}
              onChange={handleChange("cidade")}
              required
              error={Boolean(errors.cidade)}
              helperText={errors.cidade}
              fullWidth
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Input
              label="Estado"
              value={form.estado}
              inputProps={{ maxLength: 2 }}
              onChange={handleMaskedChange("estado", formatStateInput)}
              required
              error={Boolean(errors.estado)}
              helperText={errors.estado}
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
              label="Área Terreno (m²)"
              value={form.areaTerreno}
              onChange={handleMaskedChange("areaTerreno", formatAreaInput)}
              inputProps={{ inputMode: "decimal" }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Input
              label="Área Construída (m²)"
              value={form.areaConstruida}
              onChange={handleMaskedChange("areaConstruida", formatAreaInput)}
              inputProps={{ inputMode: "decimal" }}
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