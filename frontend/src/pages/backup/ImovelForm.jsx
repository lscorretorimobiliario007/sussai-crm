import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Checkbox,
  FormControlLabel,
  Grid,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import {
  ArrowBack,
  CloudUploadOutlined,
  MapOutlined,
  SaveOutlined,
  SearchOutlined,
} from "@mui/icons-material";
import MainLayout from "../components/layout/MainLayout";
import ImovelGallery from "../components/imoveis/ImovelGallery";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Loading from "../components/ui/Loading";
import { useToast } from "../components/ui/Toast";
import api from "../api/axios";
import { buscarCep, formatCep } from "../utils/cep";
import { formatDateTime } from "../utils/formatters";
import {
  CARACTERISTICAS_IMOVEL,
  FINALIDADES_IMOVEL,
  OCUPACOES_IMOVEL,
  ORIGENS_CAPTACAO,
  SITUACOES_CAPTACAO,
  STATUS_OPTIONS,
  TIPOS_IMOVEL,
  googleMapsSearchUrl,
  toDateInputValue,
} from "../utils/imoveis";

const emptyForm = {
  codigo: "",
  titulo: "",
  descricao: "",
  finalidade: "VENDA",
  tipo: "APARTAMENTO",
  status: "DISPONIVEL",
  proprietarioId: "",
  corretorId: "",
  angariadorId: "",
  dataCaptacao: "",
  origemCaptacao: "",
  situacaoCaptacao: "",
  proximoContatoProprietario: "",
  valorVenda: "",
  valorAluguel: "",
  iptu: "",
  condominio: "",
  endereco: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
  cep: "",
  areaTerreno: "",
  areaConstruida: "",
  areaUtil: "",
  quartos: 0,
  suites: 0,
  banheiros: 0,
  vagas: 0,
  piscina: false,
  churrasqueira: false,
  caracteristicas: [],
  exclusividade: false,
  aceitaFinanciamento: false,
  aceitaFgts: false,
  aceitaPermuta: false,
  aceitaVeiculo: false,
  estudaProposta: false,
  ocupacao: "DESOCUPADO",
  observacoesInternas: "",
  matricula: "",
  inscricaoMunicipal: "",
  habiteSe: false,
  averbacao: false,
  localChaves: "",
  codigoChave: "",
  chavesNaImobiliaria: true,
  chaveDigital: "",
  chaveRetirada: false,
  chaveRetiradaEm: "",
  chaveRetiradaPor: "",
  chaveDevolvidaEm: "",
  chaveObservacoes: "",
  publicadoSite: true,
  destaqueSite: false,
  lancamento: false,
  altoPadrao: false,
  publicacaoComercial: false,
  oculto: false,
  emRevisao: false,
  slug: "",
  seoTitulo: "",
  seoDescricao: "",
  tourVirtualUrl: "",
  videoUrl: "",
  plantaUrl: "",
  latitude: "",
  longitude: "",
};

const numberFields = [
  "valorVenda", "valorAluguel", "iptu", "condominio",
  "areaTerreno", "areaConstruida", "areaUtil", "latitude", "longitude",
];
const integerFields = ["quartos", "suites", "banheiros", "vagas"];
const TABS = [
  "Principais",
  "Localização",
  "Captação",
  "Documentação",
  "Comercial",
  "Publicação",
  "Características",
  "SEO & Mídia",
  "Galeria",
];

function toForm(data) {
  const form = Object.keys(emptyForm).reduce((result, key) => {
    const value = data[key];
    result[key] = value ?? emptyForm[key];
    return result;
  }, {});
  form.chaveRetiradaEm = toDateInputValue(data.chaveRetiradaEm);
  form.chaveDevolvidaEm = toDateInputValue(data.chaveDevolvidaEm);
  form.dataCaptacao = toDateInputValue(data.dataCaptacao);
  form.proximoContatoProprietario = toDateInputValue(data.proximoContatoProprietario);
  form.origemCaptacao = data.origemCaptacao || "";
  form.situacaoCaptacao = data.situacaoCaptacao || "";
  form.cep = formatCep(data.cep || "");
  const features = new Set(form.caracteristicas || []);
  if (form.piscina) features.add("PISCINA");
  if (form.churrasqueira) features.add("CHURRASQUEIRA");
  form.caracteristicas = [...features];
  return form;
}

function TabPanel({ value, index, children }) {
  if (value !== index) return null;
  return <Box sx={{ pt: 3 }}>{children}</Box>;
}

export default function ImovelForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();
  const [tab, setTab] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [options, setOptions] = useState({ proprietarios: [], corretores: [] });
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [chaveHistorico, setChaveHistorico] = useState([]);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [reordering, setReordering] = useState(false);

  const load = useCallback(async () => {
    try {
      const requests = [Promise.resolve({ data: { corretores: [], proprietarios: [] } })];
      if (editing) requests.push(api.get(`/properties/${id}`));
      const [optionsResponse, propertyResponse] = await Promise.all(requests);
      setOptions(optionsResponse.data);
      if (propertyResponse) {
        if (propertyResponse.data.ativo === false) {
          toast.error("Reative o imóvel antes de editar.");
          navigate(`/imoveis/${id}`);
          return;
        }
        setForm(toForm(propertyResponse.data));
        setExistingPhotos(propertyResponse.data.fotos || []);
        setChaveHistorico(propertyResponse.data.chaveHistorico || []);
        setUpdatedAt(propertyResponse.data.updatedAt || null);
      }
    } catch (error) {
      toast.error(error.response?.data?.erro || "Erro ao carregar formulário.");
      navigate("/imoveis");
    } finally {
      setLoading(false);
    }
  }, [editing, id, navigate, toast]);

  useEffect(() => { load(); }, [load]);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const toggleFeature = (feature) => {
    setForm((current) => {
      const next = current.caracteristicas.includes(feature)
        ? current.caracteristicas.filter((item) => item !== feature)
        : [...current.caracteristicas, feature];
      return {
        ...current,
        caracteristicas: next,
        piscina: next.includes("PISCINA"),
        churrasqueira: next.includes("CHURRASQUEIRA"),
      };
    });
  };

  const onCepBlur = async () => {
    const digits = form.cep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setCepLoading(true);
    try {
      const data = await buscarCep(digits);
      if (!data) {
        toast.warning("CEP não encontrado.");
        return;
      }
      setForm((current) => ({
        ...current,
        cep: formatCep(data.cep),
        endereco: data.endereco || current.endereco,
        bairro: data.bairro || current.bairro,
        cidade: data.cidade || current.cidade,
        estado: data.estado || current.estado,
        complemento: current.complemento || data.complemento || "",
      }));
      toast.success("Endereço preenchido pelo CEP.");
    } catch {
      toast.error("Não foi possível consultar o CEP.");
    } finally {
      setCepLoading(false);
    }
  };

  const selectFiles = (event) => {
    const selected = Array.from(event.target.files || []);
    const invalid = selected.find((file) => (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type)
      || file.size > 5 * 1024 * 1024
    ));
    if (invalid) {
      toast.error("Use apenas JPEG, PNG ou WebP com até 5 MB por foto.");
      event.target.value = "";
      return;
    }
    if (selected.length + existingPhotos.length > 20) {
      toast.error(`O limite é de 20 fotos. Já existem ${existingPhotos.length}.`);
      event.target.value = "";
      return;
    }
    setFiles(selected);
  };

  const refreshPhotos = async () => {
    const response = await api.get(`/properties/${id}/images`);
    setExistingPhotos(response.data || []);
    setChaveHistorico(response.data.chaveHistorico || []);
    setUpdatedAt(response.data.updatedAt || null);
  };

  const uploadNow = async (selected, event) => {
    if (!editing || !selected?.length) return;
    setUploading(true);
    try {
      const formData = new FormData();
      selected.forEach((file) => formData.append("images", file));
      await api.post(`/properties/${id}/images`, formData);
      await refreshPhotos();
      toast.success("Fotos enviadas.");
    } catch (error) {
      toast.error(error.response?.data?.erro || "Falha no upload das fotos.");
    } finally {
      setUploading(false);
      if (event?.target) event.target.value = "";
    }
  };

  const reorderPhotos = async (fotoIds) => {
    setReordering(true);
    try {
      const response = await api.patch(`/properties/${id}/images/order`, { imageIds: fotoIds });
      setExistingPhotos(Array.isArray(response.data) ? response.data : response.data.fotos || []);
    } catch (error) {
      toast.error(error.response?.data?.erro || "Não foi possível reordenar.");
      await refreshPhotos();
    } finally {
      setReordering(false);
    }
  };

  const setPrincipal = async (photo) => {
    try {
      await api.patch(`/properties/${id}/images/${photo.id}/cover`);
      await refreshPhotos();
      toast.success("Foto principal definida.");
    } catch (error) {
      toast.error(error.response?.data?.erro || "Erro ao definir principal.");
    }
  };

  const deletePhoto = async (photo) => {
    try {
      await api.delete(`/properties/${id}/images/${photo.id}`);
      await refreshPhotos();
      toast.success("Foto removida.");
    } catch (error) {
      toast.error(error.response?.data?.erro || "Erro ao remover foto.");
    }
  };

  const buildPayload = () => {
    const payload = { ...form };
    for (const field of numberFields) payload[field] = form[field] === "" ? null : Number(form[field]);
    for (const field of integerFields) payload[field] = Number(form[field] || 0);
    payload.proprietarioId = form.proprietarioId ? Number(form.proprietarioId) : null;
    payload.corretorId = form.corretorId ? Number(form.corretorId) : null;
    payload.angariadorId = form.angariadorId ? Number(form.angariadorId) : null;
    payload.cep = form.cep.replace(/\D/g, "");
    payload.piscina = form.caracteristicas.includes("PISCINA");
    payload.churrasqueira = form.caracteristicas.includes("CHURRASQUEIRA");
    payload.chaveRetiradaEm = form.chaveRetiradaEm || null;
    payload.chaveDevolvidaEm = form.chaveDevolvidaEm || null;
    payload.dataCaptacao = form.dataCaptacao || null;
    payload.proximoContatoProprietario = form.proximoContatoProprietario || null;
    payload.origemCaptacao = form.origemCaptacao || null;
    payload.situacaoCaptacao = form.situacaoCaptacao || null;
    [
      "observacoesInternas", "localChaves", "codigoChave", "chaveRetiradaPor", "chaveObservacoes",
      "matricula", "inscricaoMunicipal", "chaveDigital", "slug", "seoTitulo", "seoDescricao",
      "tourVirtualUrl", "videoUrl", "plantaUrl",
    ].forEach((field) => { payload[field] = form[field] || null; });
    if (["VENDIDO", "ALUGADO"].includes(form.status)) delete payload.status;
    if (!payload.codigo) delete payload.codigo;
    return payload;
  };

  const validate = () => {
    if (!form.titulo || !form.endereco || !form.bairro || !form.cidade || form.estado.length !== 2) {
      return "Preencha título e endereço completo (aba Localização).";
    }
    if (form.cep && form.cep.replace(/\D/g, "").length !== 8) return "Informe um CEP válido.";
    if (form.finalidade === "VENDA" && !(Number(form.valorVenda) > 0)) return "Informe o valor de venda.";
    if (form.finalidade === "LOCACAO" && !(Number(form.valorAluguel) > 0)) return "Informe o valor de locação.";
    if (
      form.finalidade === "VENDA_E_LOCACAO"
      && (!(Number(form.valorVenda) > 0) || !(Number(form.valorAluguel) > 0))
    ) return "Informe os valores de venda e locação.";
    if (form.chaveRetirada && !form.chaveRetiradaPor) {
      return "Informe quem retirou a chave (aba Comercial).";
    }
    return null;
  };

  const save = async () => {
    const validationError = validate();
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setSaving(true);
    try {
      const response = editing
        ? await api.patch(`/properties/${id}`, buildPayload())
        : await api.post("/properties", buildPayload());
      const propertyId = response.data.id;

      if (files.length > 0) {
        try {
          const formData = new FormData();
          files.forEach((file) => formData.append("images", file));
          await api.post(`/properties/${propertyId}/images`, formData);
        } catch (error) {
          toast.warning(error.response?.data?.erro || "Imóvel salvo, mas as fotos falharam.");
          navigate(`/imoveis/${propertyId}`);
          return;
        }
      }
      toast.success(editing ? "Imóvel atualizado com sucesso." : "Imóvel cadastrado com sucesso.");
      navigate(`/imoveis/${propertyId}`);
    } catch (error) {
      toast.error(error.response?.data?.erro || "Não foi possível salvar o imóvel.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <MainLayout title="Imóveis"><Loading variant="skeleton" /></MainLayout>;

  const derivedStatus = ["VENDIDO", "ALUGADO"].includes(form.status);
  const editableStatusOptions = derivedStatus
    ? STATUS_OPTIONS
    : STATUS_OPTIONS.filter((option) => ["DISPONIVEL", "RESERVADO"].includes(option.value));
  const mapsUrl = googleMapsSearchUrl(form);
  const corretorOptions = [
    { value: "", label: "Não informado" },
    ...options.corretores.map((item) => ({ value: item.id, label: item.nome })),
  ];

  return (
    <MainLayout title={editing ? "Editar imóvel" : "Novo imóvel"}>
      <Stack spacing={2.5}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1.5}>
          <Button color="inherit" startIcon={<ArrowBack />} onClick={() => navigate(editing ? `/imoveis/${id}` : "/imoveis")}>
            Voltar
          </Button>
          <Stack direction="row" spacing={1.5}>
            <Button color="inherit" onClick={() => navigate(editing ? `/imoveis/${id}` : "/imoveis")}>Cancelar</Button>
            <Button variant="contained" startIcon={<SaveOutlined />} loading={saving} onClick={save}>
              {editing ? "Salvar alterações" : "Cadastrar imóvel"}
            </Button>
          </Stack>
        </Stack>

        <Card contentSx={{ pt: 1 }}>
          <Tabs
            value={tab}
            onChange={(_, value) => setTab(value)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: "divider" }}
          >
            {TABS.map((label) => <Tab key={label} label={label} />)}
          </Tabs>

          <TabPanel value={tab} index={0}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
              Dados principais do anúncio e responsáveis.
            </Typography>
            <Grid container spacing={2.25}>
              <Grid size={{ xs: 12, md: 3 }}><Input label="Código (automático)" value={form.codigo} onChange={(e) => update("codigo", e.target.value)} /></Grid>
              <Grid size={{ xs: 12, md: 9 }}><Input required label="Título do anúncio" value={form.titulo} onChange={(e) => update("titulo", e.target.value)} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><Select label="Finalidade" value={form.finalidade} options={FINALIDADES_IMOVEL} onChange={(e) => update("finalidade", e.target.value)} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><Select label="Tipo do imóvel" value={form.tipo} options={TIPOS_IMOVEL} onChange={(e) => update("tipo", e.target.value)} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><Select disabled={derivedStatus} label="Status" value={form.status} options={editableStatusOptions} onChange={(e) => update("status", e.target.value)} /></Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Select
                  label="Proprietário"
                  value={form.proprietarioId}
                  options={[{ value: "", label: "Sem proprietário" }, ...options.proprietarios.map((item) => ({ value: item.id, label: item.nome }))]}
                  onChange={(e) => update("proprietarioId", e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Select
                  label="Corretor responsável"
                  value={form.corretorId}
                  options={[{ value: "", label: editing ? "Sem corretor" : "Atribuir a mim" }, ...options.corretores.map((item) => ({ value: item.id, label: item.nome }))]}
                  onChange={(e) => update("corretorId", e.target.value)}
                />
              </Grid>
              {form.finalidade !== "LOCACAO" && <Grid size={{ xs: 12, md: 4 }}><Input type="number" label="Valor de venda" value={form.valorVenda} onChange={(e) => update("valorVenda", e.target.value)} /></Grid>}
              {form.finalidade !== "VENDA" && <Grid size={{ xs: 12, md: 4 }}><Input type="number" label="Valor de locação" value={form.valorAluguel} onChange={(e) => update("valorAluguel", e.target.value)} /></Grid>}
              <Grid size={{ xs: 6, md: 3 }}><Input type="number" label="Valor condomínio" value={form.condominio} onChange={(e) => update("condominio", e.target.value)} /></Grid>
              <Grid size={{ xs: 6, md: 3 }}><Input type="number" label="Valor IPTU" value={form.iptu} onChange={(e) => update("iptu", e.target.value)} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><Input type="number" label="Área útil (m²)" value={form.areaUtil} onChange={(e) => update("areaUtil", e.target.value)} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><Input type="number" label="Área construída (m²)" value={form.areaConstruida} onChange={(e) => update("areaConstruida", e.target.value)} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><Input type="number" label="Área do terreno (m²)" value={form.areaTerreno} onChange={(e) => update("areaTerreno", e.target.value)} /></Grid>
              {integerFields.map((field) => (
                <Grid size={{ xs: 6, md: 3 }} key={field}>
                  <Input type="number" label={{ quartos: "Quartos", suites: "Suítes", banheiros: "Banheiros", vagas: "Vagas" }[field]} value={form[field]} onChange={(e) => update(field, e.target.value)} />
                </Grid>
              ))}
              <Grid size={{ xs: 12 }}><Input multiline rows={4} label="Descrição pública" value={form.descricao} onChange={(e) => update("descricao", e.target.value)} /></Grid>
              <Grid size={{ xs: 12 }}><Input multiline rows={3} label="Observações internas (CRM)" value={form.observacoesInternas} onChange={(e) => update("observacoesInternas", e.target.value)} helperText="Nunca publicadas no site." /></Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tab} index={1}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
              Endereço completo, CEP automático e coordenadas Google Maps.
            </Typography>
            <Grid container spacing={2.25}>
              <Grid size={{ xs: 12, md: 3 }}>
                <Input
                  label="CEP"
                  value={form.cep}
                  onChange={(e) => update("cep", formatCep(e.target.value))}
                  onBlur={onCepBlur}
                  helperText={cepLoading ? "Consultando ViaCEP…" : "Saia do campo para buscar"}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }} sx={{ display: "flex", alignItems: "center" }}>
                <Button variant="outlined" startIcon={<SearchOutlined />} loading={cepLoading} onClick={onCepBlur}>Buscar CEP</Button>
              </Grid>
              <Grid size={{ xs: 12, md: 7 }}><Input required label="Logradouro" value={form.endereco} onChange={(e) => update("endereco", e.target.value)} /></Grid>
              <Grid size={{ xs: 12, md: 2 }}><Input label="Número" value={form.numero} onChange={(e) => update("numero", e.target.value)} /></Grid>
              <Grid size={{ xs: 12, md: 3 }}><Input label="Complemento" value={form.complemento} onChange={(e) => update("complemento", e.target.value)} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><Input required label="Bairro" value={form.bairro} onChange={(e) => update("bairro", e.target.value)} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><Input required label="Cidade" value={form.cidade} onChange={(e) => update("cidade", e.target.value)} /></Grid>
              <Grid size={{ xs: 6, md: 2 }}><Input required label="UF" value={form.estado} slotProps={{ htmlInput: { maxLength: 2 } }} onChange={(e) => update("estado", e.target.value.toUpperCase())} /></Grid>
              <Grid size={{ xs: 6, md: 3 }}><Input type="number" label="Latitude" value={form.latitude} onChange={(e) => update("latitude", e.target.value)} /></Grid>
              <Grid size={{ xs: 6, md: 3 }}><Input type="number" label="Longitude" value={form.longitude} onChange={(e) => update("longitude", e.target.value)} /></Grid>
              <Grid size={{ xs: 12, md: 6 }} sx={{ display: "flex", alignItems: "center" }}>
                <Button
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="outlined"
                  startIcon={<MapOutlined />}
                  disabled={!form.endereco && !(form.latitude && form.longitude)}
                >
                  Abrir no Google Maps
                </Button>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tab} index={2}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
              Captação do imóvel e acompanhamento com o proprietário.
            </Typography>
            <Grid container spacing={2.25}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Input type="date" label="Data da captação" value={form.dataCaptacao} onChange={(e) => update("dataCaptacao", e.target.value)} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Select label="Corretor captador" value={form.angariadorId} options={corretorOptions} onChange={(e) => update("angariadorId", e.target.value)} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Select
                  label="Origem da captação"
                  value={form.origemCaptacao}
                  options={[{ value: "", label: "Não informado" }, ...ORIGENS_CAPTACAO]}
                  onChange={(e) => update("origemCaptacao", e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Select
                  label="Situação da captação"
                  value={form.situacaoCaptacao}
                  options={[{ value: "", label: "Não informado" }, ...SITUACOES_CAPTACAO]}
                  onChange={(e) => update("situacaoCaptacao", e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Input
                  type="date"
                  label="Próximo contato com proprietário"
                  value={form.proximoContatoProprietario}
                  onChange={(e) => update("proximoContatoProprietario", e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Input
                  label="Última atualização"
                  value={updatedAt ? formatDateTime(updatedAt) : "—"}
                  disabled
                  helperText="Atualizado automaticamente a cada alteração."
                />
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tab} index={3}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
              Documentação e registros do imóvel.
            </Typography>
            <Grid container spacing={2.25}>
              <Grid size={{ xs: 12, md: 6 }}><Input label="Matrícula" value={form.matricula} onChange={(e) => update("matricula", e.target.value)} /></Grid>
              <Grid size={{ xs: 12, md: 6 }}><Input label="Inscrição municipal" value={form.inscricaoMunicipal} onChange={(e) => update("inscricaoMunicipal", e.target.value)} /></Grid>
              <Grid size={{ xs: 6, md: 3 }}><Input type="number" label="Valor IPTU" value={form.iptu} onChange={(e) => update("iptu", e.target.value)} /></Grid>
              <Grid size={{ xs: 6, md: 3 }}><Input type="number" label="Valor condomínio" value={form.condominio} onChange={(e) => update("condominio", e.target.value)} /></Grid>
              <Grid size={{ xs: 12, sm: 4 }}><FormControlLabel control={<Checkbox checked={form.habiteSe} onChange={(e) => update("habiteSe", e.target.checked)} />} label="Habite-se" /></Grid>
              <Grid size={{ xs: 12, sm: 4 }}><FormControlLabel control={<Checkbox checked={form.averbacao} onChange={(e) => update("averbacao", e.target.checked)} />} label="Averbação" /></Grid>
              <Grid size={{ xs: 12, sm: 4 }}><FormControlLabel control={<Checkbox checked={form.exclusividade} onChange={(e) => update("exclusividade", e.target.checked)} />} label="Exclusividade" /></Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tab} index={4}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
              Condições comerciais e controle de chaves. Retirada/devolução geram histórico automático.
            </Typography>
            <Grid container spacing={2.25}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Select label="Ocupação / imóvel ocupado" value={form.ocupacao} options={OCUPACOES_IMOVEL} onChange={(e) => update("ocupacao", e.target.value)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}><FormControlLabel control={<Checkbox checked={form.aceitaFinanciamento} onChange={(e) => update("aceitaFinanciamento", e.target.checked)} />} label="Aceita financiamento" /></Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}><FormControlLabel control={<Checkbox checked={form.aceitaFgts} onChange={(e) => update("aceitaFgts", e.target.checked)} />} label="Aceita FGTS" /></Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}><FormControlLabel control={<Checkbox checked={form.aceitaPermuta} onChange={(e) => update("aceitaPermuta", e.target.checked)} />} label="Aceita permuta" /></Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}><FormControlLabel control={<Checkbox checked={form.aceitaVeiculo} onChange={(e) => update("aceitaVeiculo", e.target.checked)} />} label="Aceita veículo" /></Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}><FormControlLabel control={<Checkbox checked={form.estudaProposta} onChange={(e) => update("estudaProposta", e.target.checked)} />} label="Estuda proposta" /></Grid>
              <Grid size={{ xs: 12 }}><Typography variant="subtitle1" fontWeight={800} sx={{ mt: 1 }}>Chaves</Typography></Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}><FormControlLabel control={<Checkbox checked={form.chavesNaImobiliaria} onChange={(e) => update("chavesNaImobiliaria", e.target.checked)} />} label="Chaves na imobiliária" /></Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}><FormControlLabel control={<Checkbox checked={form.chaveRetirada} onChange={(e) => update("chaveRetirada", e.target.checked)} />} label="Chave retirada" /></Grid>
              <Grid size={{ xs: 12, md: 6 }}><Input label="Local da chave" value={form.localChaves} onChange={(e) => update("localChaves", e.target.value)} /></Grid>
              <Grid size={{ xs: 12, md: 6 }}><Input label="Código da chave" value={form.codigoChave} onChange={(e) => update("codigoChave", e.target.value)} /></Grid>
              <Grid size={{ xs: 12 }}><Input label="Chave digital (URL ou código)" value={form.chaveDigital} onChange={(e) => update("chaveDigital", e.target.value)} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><Input label="Quem retirou / devolveu" value={form.chaveRetiradaPor} onChange={(e) => update("chaveRetiradaPor", e.target.value)} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><Input type="date" label="Data da retirada" value={form.chaveRetiradaEm} onChange={(e) => update("chaveRetiradaEm", e.target.value)} InputLabelProps={{ shrink: true }} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><Input type="date" label="Data da devolução" value={form.chaveDevolvidaEm} onChange={(e) => update("chaveDevolvidaEm", e.target.value)} InputLabelProps={{ shrink: true }} /></Grid>
              <Grid size={{ xs: 12 }}><Input multiline rows={2} label="Observação das chaves" value={form.chaveObservacoes} onChange={(e) => update("chaveObservacoes", e.target.value)} /></Grid>
              {editing && (
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1.5 }}>Histórico de chaves</Typography>
                  <Stack spacing={1.5}>
                    {chaveHistorico.map((item) => (
                      <Box key={item.id} sx={{ pl: 1.5, borderLeft: 2, borderColor: "primary.light" }}>
                        <Typography fontWeight={700}>
                          {item.acao === "RETIRADA" ? "Retirada" : "Devolução"}
                          {item.retiradoPor || item.devolvidoPor ? ` — ${item.retiradoPor || item.devolvidoPor}` : ""}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {item.usuario?.nome} • {formatDateTime(item.ocorridoEm)}
                        </Typography>
                        {item.observacao && (
                          <Typography variant="caption" color="text.secondary" display="block">{item.observacao}</Typography>
                        )}
                      </Box>
                    ))}
                    {chaveHistorico.length === 0 && (
                      <Typography color="text.secondary">Nenhuma movimentação de chave registrada ainda.</Typography>
                    )}
                  </Stack>
                </Grid>
              )}
            </Grid>
          </TabPanel>

          <TabPanel value={tab} index={5}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
              Painel de publicação no site público. Oculto e Em revisão impedem a exibição.
            </Typography>
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}><FormControlLabel control={<Checkbox checked={form.publicadoSite} onChange={(e) => update("publicadoSite", e.target.checked)} />} label="Publicar no site" /></Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}><FormControlLabel control={<Checkbox checked={form.destaqueSite} onChange={(e) => update("destaqueSite", e.target.checked)} />} label="Destaque Home" /></Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}><FormControlLabel control={<Checkbox checked={form.altoPadrao} onChange={(e) => update("altoPadrao", e.target.checked)} />} label="Alto Padrão" /></Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}><FormControlLabel control={<Checkbox checked={form.publicacaoComercial} onChange={(e) => update("publicacaoComercial", e.target.checked)} />} label="Comercial" /></Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}><FormControlLabel control={<Checkbox checked={form.lancamento} onChange={(e) => update("lancamento", e.target.checked)} />} label="Lançamento" /></Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}><FormControlLabel control={<Checkbox checked={form.oculto} onChange={(e) => update("oculto", e.target.checked)} />} label="Oculto" /></Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}><FormControlLabel control={<Checkbox checked={form.emRevisao} onChange={(e) => update("emRevisao", e.target.checked)} />} label="Em revisão" /></Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tab} index={6}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
              Comodidades usadas no CRM e nos filtros do site.
            </Typography>
            <Grid container>
              {CARACTERISTICAS_IMOVEL.map((item) => (
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={item.value}>
                  <FormControlLabel
                    control={<Checkbox checked={form.caracteristicas.includes(item.value)} onChange={() => toggleFeature(item.value)} />}
                    label={item.label}
                  />
                </Grid>
              ))}
            </Grid>
          </TabPanel>

          <TabPanel value={tab} index={7}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
              SEO do anúncio, vídeo, tour e planta.
            </Typography>
            <Grid container spacing={2.25}>
              <Grid size={{ xs: 12, md: 6 }}><Input label="Título SEO" value={form.seoTitulo} onChange={(e) => update("seoTitulo", e.target.value)} helperText="Se vazio, usa o título do anúncio." /></Grid>
              <Grid size={{ xs: 12, md: 6 }}><Input label="Slug (URL amigável)" value={form.slug} onChange={(e) => update("slug", e.target.value)} placeholder="apartamento-vila-mariana" /></Grid>
              <Grid size={{ xs: 12 }}><Input multiline rows={3} label="Meta description" value={form.seoDescricao} onChange={(e) => update("seoDescricao", e.target.value)} /></Grid>
              <Grid size={{ xs: 12, md: 6 }}><Input label="Tour virtual (URL)" value={form.tourVirtualUrl} onChange={(e) => update("tourVirtualUrl", e.target.value)} /></Grid>
              <Grid size={{ xs: 12, md: 6 }}><Input label="Vídeo (URL)" value={form.videoUrl} onChange={(e) => update("videoUrl", e.target.value)} /></Grid>
              <Grid size={{ xs: 12 }}><Input label="Planta (URL da imagem/PDF)" value={form.plantaUrl} onChange={(e) => update("plantaUrl", e.target.value)} /></Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tab} index={8}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
              Arraste para ordenar, defina a foto principal e anexe mídia.
            </Typography>
            {editing ? (
              <ImovelGallery
                photos={existingPhotos}
                title={form.titulo}
                uploading={uploading}
                reordering={reordering}
                onUpload={(selected, event) => uploadNow(selected, event)}
                onDelete={deletePhoto}
                onSetPrincipal={setPrincipal}
                onReorder={reorderPhotos}
              />
            ) : (
              <Stack spacing={2}>
                <Typography color="text.secondary">
                  Salve o imóvel para gerenciar a galeria com drag-and-drop. Você já pode selecionar fotos iniciais.
                </Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
                  <Button component="label" variant="outlined" startIcon={<CloudUploadOutlined />}>
                    Selecionar fotos
                    <input hidden multiple type="file" accept="image/jpeg,image/png,image/webp" onChange={selectFiles} />
                  </Button>
                  <Typography variant="body2" color="text.secondary">
                    {files.length ? `${files.length} foto(s) selecionada(s)` : "JPEG, PNG ou WebP — até 5 MB · máx. 20"}
                  </Typography>
                </Stack>
              </Stack>
            )}
          </TabPanel>
        </Card>
      </Stack>
    </MainLayout>
  );
}
