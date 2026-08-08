import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
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
  STATUS_CLIENTE_CRM,
  TIPOS_CLIENTE,
  TIPOS_CONTATO,
  TIPOS_ENDERECO,
  TIPOS_PESSOA,
  formatCpfCnpj,
  formatPhone,
} from "../utils/clientes";
import { buscarCep, formatCep } from "../utils/cep";

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
  const form = {
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
  form.cpfCnpj = formatCpfCnpj(form.cpfCnpj);
  form.telefone = formatPhone(form.telefone);
  form.whatsapp = formatPhone(form.whatsapp);
  return form;
}

function parseList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function emptyToNull(value) {
  if (value == null) return null;
  const trimmed = String(value).trim();
  return trimmed === "" ? null : trimmed;
}

function normalizePrimary(items) {
  if (!items.length) return [];
  const principalIndex = items.findIndex((item) => item.principal);
  const selectedIndex = principalIndex >= 0 ? principalIndex : 0;
  const selected = items[selectedIndex];
  return [
    { ...selected, principal: true },
    ...items
      .filter((_, index) => index !== selectedIndex)
      .map((item) => ({ ...item, principal: false })),
  ];
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
  const [cepLoadingByIndex, setCepLoadingByIndex] = useState({});
  const cepRequestsRef = useRef(new Map());

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
            numero: formatPhone(item.numero),
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
            cep: formatCep(item.cep || ""),
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

  const updatePhone = (index, values) => {
    setTelefones((current) =>
      current.map((row, itemIndex) => (itemIndex === index ? { ...row, ...values } : row))
    );
  };

  const updateAddress = (index, values) => {
    setEnderecos((current) =>
      current.map((row, itemIndex) => (itemIndex === index ? { ...row, ...values } : row))
    );
  };

  const updatePrimaryCellphone = (value) => {
    const numero = formatPhone(value);
    setTelefones((current) => {
      const index = current.findIndex((item) => item.tipo === "CELULAR" && item.principal);
      const fallbackIndex = current.findIndex((item) => item.tipo === "CELULAR");
      const targetIndex = index >= 0 ? index : fallbackIndex;
      if (targetIndex < 0) {
        return [...current, { numero, tipo: "CELULAR", principal: current.length === 0 }];
      }
      return current.map((item, itemIndex) =>
        itemIndex === targetIndex ? { ...item, numero } : item
      );
    });
  };

  const consultarCep = async (index, digits) => {
    const requestId = (cepRequestsRef.current.get(index) || 0) + 1;
    const expectedCep = formatCep(digits);
    const snapshot = enderecos[index];
    cepRequestsRef.current.set(index, requestId);
    setCepLoadingByIndex((current) => ({ ...current, [index]: true }));
    try {
      const data = await buscarCep(digits);
      if (requestId !== cepRequestsRef.current.get(index)) return;
      if (!data) {
        toast.warning("CEP não encontrado. Confira os números ou preencha o endereço manualmente.");
        return;
      }
      setEnderecos((current) =>
        current.map((row, itemIndex) =>
          itemIndex === index && row.cep === expectedCep
            ? {
                ...row,
                cep: formatCep(data.cep),
                logradouro: row.logradouro === snapshot.logradouro
                  ? data.endereco || row.logradouro
                  : row.logradouro,
                bairro: row.bairro === snapshot.bairro ? data.bairro || row.bairro : row.bairro,
                cidade: row.cidade === snapshot.cidade ? data.cidade || row.cidade : row.cidade,
                estado: row.estado === snapshot.estado ? data.estado || row.estado : row.estado,
                complemento: row.complemento === snapshot.complemento
                  ? data.complemento || row.complemento
                  : row.complemento,
              }
            : row
        )
      );
    } catch {
      if (requestId !== cepRequestsRef.current.get(index)) return;
      toast.error("Não foi possível consultar o CEP. Preencha o endereço manualmente.");
    } finally {
      if (requestId === cepRequestsRef.current.get(index)) {
        setCepLoadingByIndex((current) => ({ ...current, [index]: false }));
      }
    }
  };

  const handleCepChange = (index, value) => {
    const cep = formatCep(value);
    const digits = cep.replace(/\D/g, "");
    updateAddress(index, { cep });
    if (digits.length === 8) {
      consultarCep(index, digits);
    } else {
      cepRequestsRef.current.set(index, (cepRequestsRef.current.get(index) || 0) + 1);
      setCepLoadingByIndex((current) => ({ ...current, [index]: false }));
    }
  };

  const toggleInterest = (interest) => {
    setForm((current) => ({
      ...current,
      interesses: current.interesses.includes(interest)
        ? current.interesses.filter((item) => item !== interest)
        : [...current.interesses, interest],
    }));
  };

  const buildPayload = () => {
    const principalAddress =
      enderecos.find((item) => item.principal && item.logradouro.trim())
      || enderecos.find((item) => item.logradouro.trim());
    const enderecoResumido = principalAddress
      ? [principalAddress.logradouro, principalAddress.numero].filter(Boolean).join(", ")
      : form.endereco;

    return {
      ...form,
      razaoSocial: emptyToNull(form.razaoSocial),
      nomeFantasia: emptyToNull(form.nomeFantasia),
      email: emptyToNull(form.email),
      telefone: emptyToNull(form.telefone),
      whatsapp: emptyToNull(form.whatsapp),
      endereco: emptyToNull(enderecoResumido),
      cidade: emptyToNull(principalAddress?.cidade || form.cidade),
      estado: emptyToNull((principalAddress?.estado || form.estado).toUpperCase()),
      notas: emptyToNull(form.notas),
      origem: emptyToNull(form.origem),
      faixaPrecoMin: form.faixaPrecoMin === "" ? null : Number(form.faixaPrecoMin),
      faixaPrecoMax: form.faixaPrecoMax === "" ? null : Number(form.faixaPrecoMax),
      corretorId: form.corretorId ? Number(form.corretorId) : null,
      cidadesInteresse: parseList(form.cidadesInteresse),
      tags: parseList(form.tags),
      cpfCnpj: form.cpfCnpj.replace(/\D/g, "") || null,
    };
  };

  const syncContacts = async (clienteId) => {
    const phones = normalizePrimary(telefones.filter((item) => item.numero.trim()));
    const mailList = normalizePrimary(emails.filter((item) => item.email.trim()));
    const addresses = normalizePrimary(
      enderecos.filter((item) => item.logradouro.trim() && item.cidade.trim() && item.estado.trim())
    );
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
    const documentDigits = form.cpfCnpj.replace(/\D/g, "");
    if (documentDigits && ![11, 14].includes(documentDigits.length)) {
      toast.error("Informe um CPF ou CNPJ válido.");
      return;
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error("Informe um e-mail válido.");
      return;
    }
    const invalidEmail = emails.find(
      (item) => item.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item.email)
    );
    if (invalidEmail) {
      toast.error("Revise os e-mails adicionais informados.");
      return;
    }
    const invalidPhone = telefones.find((item) => {
      const digits = item.numero.replace(/\D/g, "");
      return digits && ![10, 11].includes(digits.length);
    });
    const invalidMainPhone = [form.telefone, form.whatsapp].find((value) => {
      const digits = value.replace(/\D/g, "");
      return digits && ![10, 11].includes(digits.length);
    });
    if (invalidPhone || invalidMainPhone) {
      toast.error("Informe telefones com DDD e 10 ou 11 números.");
      return;
    }
    const invalidAddress = enderecos.find((item) => {
      const started = [
        item.logradouro,
        item.numero,
        item.complemento,
        item.bairro,
        item.cidade,
        item.estado,
        item.cep,
      ].some((value) => value.trim());
      const cepDigits = item.cep.replace(/\D/g, "");
      return started && (
        !item.logradouro.trim()
        || !item.cidade.trim()
        || item.estado.trim().length !== 2
        || (item.cep && cepDigits.length !== 8)
      );
    });
    if (invalidAddress) {
      toast.error("Complete rua, cidade, UF e um CEP válido nos endereços informados.");
      return;
    }
    const minPrice = form.faixaPrecoMin === "" ? null : Number(form.faixaPrecoMin);
    const maxPrice = form.faixaPrecoMax === "" ? null : Number(form.faixaPrecoMax);
    if (
      (minPrice !== null && (!Number.isFinite(minPrice) || minPrice < 0))
      || (maxPrice !== null && (!Number.isFinite(maxPrice) || maxPrice < 0))
      || (minPrice !== null && maxPrice !== null && maxPrice < minPrice)
    ) {
      toast.error("Informe uma faixa de preço válida, com o máximo maior ou igual ao mínimo.");
      return;
    }
    setSaving(true);
    try {
      const payload = buildPayload();
      const response = editing
        ? await api.put(`/clientes/${id}`, payload)
        : await api.post("/clientes", payload);
      const clienteId = response.data.id;
      try {
        await syncContacts(clienteId);
      } catch (error) {
        toast.warning(
          error.response?.data?.erro
            ? `Cliente salvo, mas os contatos falharam: ${error.response.data.erro}`
            : "Cliente salvo, mas não foi possível sincronizar contatos e endereços."
        );
        navigate(`/clientes/${clienteId}`);
        return;
      }
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

  const primaryCellphone =
    telefones.find((item) => item.tipo === "CELULAR" && item.principal)?.numero
    || telefones.find((item) => item.tipo === "CELULAR")?.numero
    || "";
  const cepLookupActive = Object.values(cepLoadingByIndex).some(Boolean);

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
            <Grid size={{ xs: 12, md: 4 }}><Select label="Status" value={form.status} options={STATUS_CLIENTE_CRM} onChange={(event) => update("status", event.target.value)} /></Grid>
            <Grid size={{ xs: 12, md: 6 }}><Input label="Nome" value={form.nome} onChange={(event) => update("nome", event.target.value)} required /></Grid>
            <Grid size={{ xs: 12, md: 6 }}><Input label="CPF / CNPJ" value={form.cpfCnpj} onChange={(event) => update("cpfCnpj", formatCpfCnpj(event.target.value))} slotProps={{ htmlInput: { inputMode: "numeric", maxLength: 18 } }} /></Grid>
            {form.tipoPessoa === "PJ" && (
              <>
                <Grid size={{ xs: 12, md: 6 }}><Input label="Razão social" value={form.razaoSocial} onChange={(event) => update("razaoSocial", event.target.value)} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><Input label="Nome fantasia" value={form.nomeFantasia} onChange={(event) => update("nomeFantasia", event.target.value)} /></Grid>
              </>
            )}
            <Grid size={{ xs: 12, md: 3 }}><Input type="email" label="E-mail principal" value={form.email} onChange={(event) => update("email", event.target.value)} /></Grid>
            <Grid size={{ xs: 12, md: 3 }}><Input label="Telefone" value={form.telefone} onChange={(event) => update("telefone", formatPhone(event.target.value))} slotProps={{ htmlInput: { inputMode: "tel", maxLength: 15 } }} /></Grid>
            <Grid size={{ xs: 12, md: 3 }}><Input label="Celular" value={primaryCellphone} onChange={(event) => updatePrimaryCellphone(event.target.value)} slotProps={{ htmlInput: { inputMode: "tel", maxLength: 15 } }} /></Grid>
            <Grid size={{ xs: 12, md: 3 }}><Input label="WhatsApp" value={form.whatsapp} onChange={(event) => update("whatsapp", formatPhone(event.target.value))} slotProps={{ htmlInput: { inputMode: "tel", maxLength: 15 } }} /></Grid>
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
                <Grid size={{ xs: 12, md: 5 }}><Input label="Número" value={item.numero} onChange={(event) => updatePhone(index, { numero: formatPhone(event.target.value) })} slotProps={{ htmlInput: { inputMode: "tel", maxLength: 15 } }} /></Grid>
                <Grid size={{ xs: 12, md: 4 }}><Select label="Tipo" value={item.tipo} options={TIPOS_CONTATO} onChange={(event) => updatePhone(index, { tipo: event.target.value })} /></Grid>
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
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Input
                      label="CEP"
                      value={item.cep}
                      onChange={(event) => handleCepChange(index, event.target.value)}
                      helperText={cepLoadingByIndex[index] ? "Consultando ViaCEP..." : "Digite os 8 números para buscar"}
                      slotProps={{
                        htmlInput: { inputMode: "numeric", maxLength: 9 },
                        input: {
                          endAdornment: cepLoadingByIndex[index] ? (
                            <InputAdornment position="end">
                              <CircularProgress size={18} />
                            </InputAdornment>
                          ) : null,
                        },
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 5 }}><Input label="Cidade" value={item.cidade} onChange={(event) => setEnderecos((current) => current.map((row, i) => (i === index ? { ...row, cidade: event.target.value } : row)))} /></Grid>
                  <Grid size={{ xs: 6, md: 3 }}><Input label="UF" value={item.estado} onChange={(event) => updateAddress(index, { estado: event.target.value.replace(/[^a-z]/gi, "").slice(0, 2).toUpperCase() })} slotProps={{ htmlInput: { maxLength: 2 } }} /></Grid>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <FormControlLabel
                      control={<Switch checked={item.principal} onChange={(event) => setEnderecos((current) => current.map((row, i) => ({ ...row, principal: i === index ? event.target.checked : false })))} />}
                      label="Principal"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 1 }}>
                    <IconButton color="error" disabled={enderecos.length === 1 || cepLookupActive} onClick={() => setEnderecos((current) => current.filter((_, i) => i !== index))}><DeleteOutlined /></IconButton>
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
