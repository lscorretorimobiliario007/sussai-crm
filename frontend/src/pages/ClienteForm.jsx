import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Chip,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import { Add, ArrowBack, DeleteOutlined, SaveOutlined } from "@mui/icons-material";
import MainLayout from "../components/layout/MainLayout";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Loading from "../components/ui/Loading";
import Select from "../components/ui/Select";
import { useToast } from "../components/ui/Toast";
import api from "../api/axios";
import {
  INTERESSES_CLIENTE,
  STATUS_CLIENTE,
  TIPOS_CLIENTE,
  TIPOS_CONTATO,
  TIPOS_ENDERECO,
  TIPOS_PESSOA,
} from "../utils/clientes";

const emptyForm = {
  tipo: "LEAD",
  tipoPessoa: "PF",
  status: "PROSPECTO",
  nome: "",
  razaoSocial: "",
  nomeFantasia: "",
  cpfCnpj: "",
  email: "",
  telefone: "",
  whatsapp: "",
  endereco: "",
  cidade: "",
  estado: "",
  notas: "",
  origem: "",
  interesses: [],
  faixaPrecoMin: "",
  faixaPrecoMax: "",
  cidadesInteresse: "",
  tags: "",
  corretorId: "",
};

const emptyPhone = { numero: "", tipo: "CELULAR", principal: true };
const emptyEmail = { email: "", tipo: "OUTRO", principal: true };
const emptyAddress = {
  tipo: "RESIDENCIAL",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
  cep: "",
  principal: true,
};

function toForm(data) {
  return {
    ...emptyForm,
    ...Object.keys(emptyForm).reduce((result, key) => {
      result[key] = data[key] ?? emptyForm[key];
      return result;
    }, {}),
    interesses: data.interesses || [],
    cidadesInteresse: (data.cidadesInteresse || []).join(", "),
    tags: (data.tags || []).join(", "),
    faixaPrecoMin: data.faixaPrecoMin ?? "",
    faixaPrecoMax: data.faixaPrecoMax ?? "",
    corretorId: data.corretorId ?? "",
  };
}

function parseList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function ClienteForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState(emptyForm);
  const [options, setOptions] = useState({ corretores: [] });
  const [telefones, setTelefones] = useState([{ ...emptyPhone }]);
  const [emails, setEmails] = useState([{ ...emptyEmail }]);
  const [enderecos, setEnderecos] = useState([{ ...emptyAddress }]);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const requests = [api.get("/clientes/opcoes")];
      if (editing) requests.push(api.get(`/clientes/${id}`));
      const [optionsResponse, clientResponse] = await Promise.all(requests);
      setOptions(optionsResponse.data);
      if (clientResponse) {
        if (clientResponse.data.ativo === false) {
          toast.error("Reative o cliente antes de editar.");
          navigate(`/clientes/${id}`);
          return;
        }
        setForm(toForm(clientResponse.data));
        setTelefones(clientResponse.data.telefones?.length
          ? clientResponse.data.telefones.map((item) => ({
            numero: item.numero,
            tipo: item.tipo,
            principal: item.principal,
          }))
          : [{ ...emptyPhone }]);
        setEmails(clientResponse.data.emails?.length
          ? clientResponse.data.emails.map((item) => ({
            email: item.email,
            tipo: item.tipo,
            principal: item.principal,
          }))
          : [{ ...emptyEmail }]);
        setEnderecos(clientResponse.data.enderecos?.length
          ? clientResponse.data.enderecos.map((item) => ({
            tipo: item.tipo,
            logradouro: item.logradouro,
            numero: item.numero || "",
            complemento: item.complemento || "",
            bairro: item.bairro || "",
            cidade: item.cidade,
            estado: item.estado,
            cep: item.cep || "",
            principal: item.principal,
          }))
          : [{ ...emptyAddress }]);
      }
    } catch (error) {
      toast.error(error.response?.data?.erro || "Erro ao carregar formulário.");
      navigate("/clientes");
    } finally {
      setLoading(false);
    }
  }, [editing, id, navigate, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const toggleInterest = (interest) => {
    setForm((current) => ({
      ...current,
      interesses: current.interesses.includes(interest)
        ? current.interesses.filter((item) => item !== interest)
        : [...current.interesses, interest],
    }));
  };

  const buildPayload = () => ({
    ...form,
    faixaPrecoMin: form.faixaPrecoMin === "" ? null : Number(form.faixaPrecoMin),
    faixaPrecoMax: form.faixaPrecoMax === "" ? null : Number(form.faixaPrecoMax),
    corretorId: form.corretorId ? Number(form.corretorId) : null,
    cidadesInteresse: parseList(form.cidadesInteresse),
    tags: parseList(form.tags),
    cpfCnpj: form.cpfCnpj.replace(/\D/g, ""),
    estado: form.estado.toUpperCase(),
  });

  const syncContacts = async (clienteId) => {
    const phones = telefones.filter((item) => item.numero.trim());
    const mailList = emails.filter((item) => item.email.trim());
    const addresses = enderecos.filter((item) => item.logradouro.trim() && item.cidade.trim() && item.estado.trim());
    await api.put(`/clientes/${clienteId}/contatos`, {
      telefones: phones,
      emails: mailList,
      enderecos: addresses.map((item) => ({
        ...item,
        estado: item.estado.toUpperCase(),
        cep: item.cep.replace(/\D/g, ""),
      })),
    });
  };

  const save = async () => {
    if (!form.nome.trim()) {
      toast.error("Informe o nome do cliente.");
      return;
    }
    setSaving(true);
    try {
      const payload = buildPayload();
      const response = editing
        ? await api.put(`/clientes/${id}`, payload)
        : await api.post("/clientes", payload);
      const clienteId = response.data.id;
      await syncContacts(clienteId);
      toast.success(editing ? "Cliente atualizado." : "Cliente cadastrado.");
      navigate(`/clientes/${clienteId}`);
    } catch (error) {
      toast.error(error.response?.data?.erro || "Erro ao salvar cliente.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <MainLayout title="Cliente"><Loading variant="skeleton" rows={8} /></MainLayout>;
  }

  return (
    <MainLayout title={editing ? "Editar cliente" : "Novo cliente"}>
      <Stack spacing={3}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "center" }} gap={2}>
          <Box>
            <Button color="inherit" startIcon={<ArrowBack />} onClick={() => navigate(editing ? `/clientes/${id}` : "/clientes")}>
              Voltar
            </Button>
            <Typography variant="h5" fontWeight={850} sx={{ mt: 1 }}>
              {editing ? "Editar cadastro" : "Novo cadastro de cliente"}
            </Typography>
            <Typography color="text.secondary">
              Pessoa física ou jurídica, interesses, contatos e responsável comercial.
            </Typography>
          </Box>
          <Button variant="contained" size="large" startIcon={<SaveOutlined />} loading={saving} onClick={save}>
            Salvar cliente
          </Button>
        </Stack>

        <Card>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>Dados principais</Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}><Select label="Tipo" value={form.tipo} options={TIPOS_CLIENTE} onChange={(event) => update("tipo", event.target.value)} /></Grid>
            <Grid size={{ xs: 12, md: 4 }}><Select label="Pessoa" value={form.tipoPessoa} options={TIPOS_PESSOA} onChange={(event) => update("tipoPessoa", event.target.value)} /></Grid>
            <Grid size={{ xs: 12, md: 4 }}><Select label="Status" value={form.status} options={STATUS_CLIENTE} onChange={(event) => update("status", event.target.value)} /></Grid>
            <Grid size={{ xs: 12, md: 6 }}><Input label="Nome" value={form.nome} onChange={(event) => update("nome", event.target.value)} required /></Grid>
            <Grid size={{ xs: 12, md: 6 }}><Input label="CPF / CNPJ" value={form.cpfCnpj} onChange={(event) => update("cpfCnpj", event.target.value)} /></Grid>
            {form.tipoPessoa === "PJ" && (
              <>
                <Grid size={{ xs: 12, md: 6 }}><Input label="Razão social" value={form.razaoSocial} onChange={(event) => update("razaoSocial", event.target.value)} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><Input label="Nome fantasia" value={form.nomeFantasia} onChange={(event) => update("nomeFantasia", event.target.value)} /></Grid>
              </>
            )}
            <Grid size={{ xs: 12, md: 4 }}><Input label="E-mail principal" value={form.email} onChange={(event) => update("email", event.target.value)} /></Grid>
            <Grid size={{ xs: 12, md: 4 }}><Input label="Telefone principal" value={form.telefone} onChange={(event) => update("telefone", event.target.value)} /></Grid>
            <Grid size={{ xs: 12, md: 4 }}><Input label="WhatsApp" value={form.whatsapp} onChange={(event) => update("whatsapp", event.target.value)} /></Grid>
            <Grid size={{ xs: 12, md: 6 }}><Input label="Endereço resumido" value={form.endereco} onChange={(event) => update("endereco", event.target.value)} /></Grid>
            <Grid size={{ xs: 12, md: 3 }}><Input label="Cidade" value={form.cidade} onChange={(event) => update("cidade", event.target.value)} /></Grid>
            <Grid size={{ xs: 12, md: 3 }}><Input label="UF" value={form.estado} onChange={(event) => update("estado", event.target.value)} slotProps={{ htmlInput: { maxLength: 2 } }} /></Grid>
            <Grid size={{ xs: 12, md: 4 }}><Input label="Origem do lead" value={form.origem} onChange={(event) => update("origem", event.target.value)} placeholder="Indicação, portal, Instagram..." /></Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Select
                label="Corretor responsável"
                value={form.corretorId}
                options={[{ value: "", label: "Selecionar" }, ...(options.corretores || []).map((item) => ({ value: item.id, label: item.nome }))]}
                onChange={(event) => update("corretorId", event.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 2 }}><Input type="number" label="Faixa mín." value={form.faixaPrecoMin} onChange={(event) => update("faixaPrecoMin", event.target.value)} /></Grid>
            <Grid size={{ xs: 6, md: 2 }}><Input type="number" label="Faixa máx." value={form.faixaPrecoMax} onChange={(event) => update("faixaPrecoMax", event.target.value)} /></Grid>
            <Grid size={{ xs: 12 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Interesses</Typography>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {INTERESSES_CLIENTE.map((item) => (
                  <Chip
                    key={item.value}
                    label={item.label}
                    clickable
                    color={form.interesses.includes(item.value) ? "primary" : "default"}
                    variant={form.interesses.includes(item.value) ? "filled" : "outlined"}
                    onClick={() => toggleInterest(item.value)}
                  />
                ))}
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}><Input label="Cidades de interesse" value={form.cidadesInteresse} onChange={(event) => update("cidadesInteresse", event.target.value)} helperText="Separe por vírgula" /></Grid>
            <Grid size={{ xs: 12, md: 6 }}><Input label="Tags" value={form.tags} onChange={(event) => update("tags", event.target.value)} helperText="Separe por vírgula" /></Grid>
            <Grid size={{ xs: 12 }}><Input multiline rows={3} label="Observações" value={form.notas} onChange={(event) => update("notas", event.target.value)} /></Grid>
          </Grid>
        </Card>

        <Card>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6" fontWeight={800}>Telefones</Typography>
            <Button startIcon={<Add />} onClick={() => setTelefones((current) => [...current, { numero: "", tipo: "CELULAR", principal: false }])}>
              Adicionar
            </Button>
          </Stack>
          <Stack spacing={2}>
            {telefones.map((item, index) => (
              <Grid container spacing={2} key={`phone-${index}`} alignItems="center">
                <Grid size={{ xs: 12, md: 5 }}><Input label="Número" value={item.numero} onChange={(event) => setTelefones((current) => current.map((row, i) => (i === index ? { ...row, numero: event.target.value } : row)))} /></Grid>
                <Grid size={{ xs: 12, md: 4 }}><Select label="Tipo" value={item.tipo} options={TIPOS_CONTATO} onChange={(event) => setTelefones((current) => current.map((row, i) => (i === index ? { ...row, tipo: event.target.value } : row)))} /></Grid>
                <Grid size={{ xs: 8, md: 2 }}>
                  <FormControlLabel
                    control={<Switch checked={item.principal} onChange={(event) => setTelefones((current) => current.map((row, i) => ({ ...row, principal: i === index ? event.target.checked : false })))} />}
                    label="Principal"
                  />
                </Grid>
                <Grid size={{ xs: 4, md: 1 }}>
                  <IconButton color="error" disabled={telefones.length === 1} onClick={() => setTelefones((current) => current.filter((_, i) => i !== index))}><DeleteOutlined /></IconButton>
                </Grid>
              </Grid>
            ))}
          </Stack>

          <Divider sx={{ my: 3 }} />

          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6" fontWeight={800}>E-mails</Typography>
            <Button startIcon={<Add />} onClick={() => setEmails((current) => [...current, { email: "", tipo: "OUTRO", principal: false }])}>
              Adicionar
            </Button>
          </Stack>
          <Stack spacing={2}>
            {emails.map((item, index) => (
              <Grid container spacing={2} key={`email-${index}`} alignItems="center">
                <Grid size={{ xs: 12, md: 5 }}><Input label="E-mail" value={item.email} onChange={(event) => setEmails((current) => current.map((row, i) => (i === index ? { ...row, email: event.target.value } : row)))} /></Grid>
                <Grid size={{ xs: 12, md: 4 }}><Select label="Tipo" value={item.tipo} options={TIPOS_CONTATO} onChange={(event) => setEmails((current) => current.map((row, i) => (i === index ? { ...row, tipo: event.target.value } : row)))} /></Grid>
                <Grid size={{ xs: 8, md: 2 }}>
                  <FormControlLabel
                    control={<Switch checked={item.principal} onChange={(event) => setEmails((current) => current.map((row, i) => ({ ...row, principal: i === index ? event.target.checked : false })))} />}
                    label="Principal"
                  />
                </Grid>
                <Grid size={{ xs: 4, md: 1 }}>
                  <IconButton color="error" disabled={emails.length === 1} onClick={() => setEmails((current) => current.filter((_, i) => i !== index))}><DeleteOutlined /></IconButton>
                </Grid>
              </Grid>
            ))}
          </Stack>

          <Divider sx={{ my: 3 }} />

          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6" fontWeight={800}>Endereços</Typography>
            <Button startIcon={<Add />} onClick={() => setEnderecos((current) => [...current, { ...emptyAddress, principal: false }])}>
              Adicionar
            </Button>
          </Stack>
          <Stack spacing={2.5}>
            {enderecos.map((item, index) => (
              <Box key={`address-${index}`} sx={{ p: 2, borderRadius: 2, border: 1, borderColor: "divider" }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 3 }}><Select label="Tipo" value={item.tipo} options={TIPOS_ENDERECO} onChange={(event) => setEnderecos((current) => current.map((row, i) => (i === index ? { ...row, tipo: event.target.value } : row)))} /></Grid>
                  <Grid size={{ xs: 12, md: 6 }}><Input label="Logradouro" value={item.logradouro} onChange={(event) => setEnderecos((current) => current.map((row, i) => (i === index ? { ...row, logradouro: event.target.value } : row)))} /></Grid>
                  <Grid size={{ xs: 12, md: 3 }}><Input label="Número" value={item.numero} onChange={(event) => setEnderecos((current) => current.map((row, i) => (i === index ? { ...row, numero: event.target.value } : row)))} /></Grid>
                  <Grid size={{ xs: 12, md: 4 }}><Input label="Complemento" value={item.complemento} onChange={(event) => setEnderecos((current) => current.map((row, i) => (i === index ? { ...row, complemento: event.target.value } : row)))} /></Grid>
                  <Grid size={{ xs: 12, md: 4 }}><Input label="Bairro" value={item.bairro} onChange={(event) => setEnderecos((current) => current.map((row, i) => (i === index ? { ...row, bairro: event.target.value } : row)))} /></Grid>
                  <Grid size={{ xs: 12, md: 4 }}><Input label="CEP" value={item.cep} onChange={(event) => setEnderecos((current) => current.map((row, i) => (i === index ? { ...row, cep: event.target.value } : row)))} /></Grid>
                  <Grid size={{ xs: 12, md: 5 }}><Input label="Cidade" value={item.cidade} onChange={(event) => setEnderecos((current) => current.map((row, i) => (i === index ? { ...row, cidade: event.target.value } : row)))} /></Grid>
                  <Grid size={{ xs: 6, md: 3 }}><Input label="UF" value={item.estado} onChange={(event) => setEnderecos((current) => current.map((row, i) => (i === index ? { ...row, estado: event.target.value } : row)))} slotProps={{ htmlInput: { maxLength: 2 } }} /></Grid>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <FormControlLabel
                      control={<Switch checked={item.principal} onChange={(event) => setEnderecos((current) => current.map((row, i) => ({ ...row, principal: i === index ? event.target.checked : false })))} />}
                      label="Principal"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 1 }}>
                    <IconButton color="error" disabled={enderecos.length === 1} onClick={() => setEnderecos((current) => current.filter((_, i) => i !== index))}><DeleteOutlined /></IconButton>
                  </Grid>
                </Grid>
              </Box>
            ))}
          </Stack>
        </Card>
      </Stack>
    </MainLayout>
  );
}
