import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box, CircularProgress, Grid, InputAdornment, Stack, Typography,
} from "@mui/material";
import { ArrowBack, SaveOutlined } from "@mui/icons-material";
import MainLayout from "../components/layout/MainLayout";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Loading from "../components/ui/Loading";
import { useToast } from "../components/ui/Toast";
import api from "../api/axios";
import { buscarCep, formatCep } from "../utils/cep";
import { formatCnpj, formatCpf, formatPhone } from "../utils/clientes";
import { isValidCnpj, isValidCpf } from "../utils/validators";

const emptyForm = {
  nome: "", cpf: "", cnpj: "", rg: "", email: "", telefone: "", celular: "",
  whatsapp: "", cep: "", rua: "", numero: "", complemento: "", bairro: "",
  cidade: "", estado: "", observacoes: "",
};

export default function ProprietarioForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const load = useCallback(async () => {
    if (!editing) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get(`/proprietarios/${id}`);
      if (data) {
        if (data.ativo === false) {
          toast.error("Reative antes de editar.");
          navigate(`/proprietarios/${id}`);
          return;
        }
        setForm({
          ...emptyForm,
          nome: data.nome || "",
          cpf: formatCpf(data.cpf || ""),
          cnpj: formatCnpj(data.cnpj || ""),
          rg: data.rg || "",
          email: data.email || "",
          telefone: formatPhone(data.telefone || ""),
          celular: formatPhone(data.celular || ""),
          whatsapp: formatPhone(data.whatsapp || ""),
          cep: formatCep(data.cep || ""),
          rua: data.rua || "",
          numero: data.numero || "",
          complemento: data.complemento || "",
          bairro: data.bairro || "",
          cidade: data.cidade || "",
          estado: data.estado || "",
          observacoes: data.observacoes || "",
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.erro || "Erro ao carregar formulário.");
      navigate("/proprietarios");
    } finally {
      setLoading(false);
    }
  }, [editing, id, navigate, toast]);

  useEffect(() => { load(); }, [load]);

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const save = async () => {
    const nextErrors = {};
    if (!form.nome.trim()) nextErrors.nome = "Informe o nome.";
    if (form.cpf && !isValidCpf(form.cpf)) nextErrors.cpf = "CPF inválido.";
    if (form.cnpj && !isValidCnpj(form.cnpj)) nextErrors.cnpj = "CNPJ inválido.";
    if (form.cep && form.cep.replace(/\D/g, "").length !== 8) nextErrors.cep = "CEP inválido.";
    if (form.estado && form.estado.length !== 2) nextErrors.estado = "Informe a UF.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      toast.error("Revise os campos destacados.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        nome: form.nome.trim(),
        cpf: form.cpf.replace(/\D/g, "") || null,
        cnpj: form.cnpj.replace(/\D/g, "") || null,
        rg: form.rg.trim() || null,
        email: form.email.trim() || null,
        telefone: form.telefone.replace(/\D/g, "") || null,
        celular: form.celular.replace(/\D/g, "") || null,
        whatsapp: form.whatsapp.replace(/\D/g, "") || null,
        cep: form.cep.replace(/\D/g, "") || null,
        rua: form.rua.trim() || null,
        numero: form.numero.trim() || null,
        complemento: form.complemento.trim() || null,
        bairro: form.bairro.trim() || null,
        cidade: form.cidade.trim() || null,
        estado: form.estado.trim().toUpperCase() || null,
        observacoes: form.observacoes.trim() || null,
      };
      const response = editing
        ? await api.put(`/proprietarios/${id}`, payload)
        : await api.post("/proprietarios", payload);
      const proprietarioId = response.data.id;
      toast.success(editing ? "Proprietário atualizado." : "Proprietário cadastrado.");
      navigate(`/proprietarios/${proprietarioId}`);
    } catch (error) {
      toast.error(error.response?.data?.erro || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <MainLayout title="Proprietário"><Loading variant="skeleton" rows={8} /></MainLayout>;

  const handleCep = async (value) => {
    const formatted = formatCep(value);
    update("cep", formatted);
    const cep = formatted.replace(/\D/g, "");
    if (cep.length !== 8) return;
    setCepLoading(true);
    try {
      const address = await buscarCep(cep);
      if (!address) {
        setErrors((current) => ({ ...current, cep: "CEP não encontrado." }));
        return;
      }
      setForm((current) => ({
        ...current,
        cep: formatCep(address.cep),
        rua: address.endereco || current.rua,
        bairro: address.bairro || current.bairro,
        cidade: address.cidade || current.cidade,
        estado: address.estado || current.estado,
      }));
    } catch {
      toast.error("Não foi possível consultar o CEP. Preencha manualmente.");
    } finally {
      setCepLoading(false);
    }
  };

  return (
    <MainLayout title={editing ? "Editar proprietário" : "Novo proprietário"}>
      <Stack spacing={3}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={2}>
          <Box>
            <Button color="inherit" startIcon={<ArrowBack />} onClick={() => navigate(editing ? `/proprietarios/${id}` : "/proprietarios")}>Voltar</Button>
            <Typography variant="h5" fontWeight={850} sx={{ mt: 1 }}>
              {editing ? "Editar proprietário" : "Cadastro de proprietário"}
            </Typography>
          </Box>
          <Button variant="contained" size="large" startIcon={<SaveOutlined />} loading={saving} onClick={save}>Salvar</Button>
        </Stack>

        <Card>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>Dados cadastrais</Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}><Input label="Nome" value={form.nome} onChange={(event) => update("nome", event.target.value)} required error={Boolean(errors.nome)} helperText={errors.nome} /></Grid>
            <Grid size={{ xs: 12, md: 4 }}><Input label="CPF" value={form.cpf} onChange={(event) => update("cpf", formatCpf(event.target.value))} error={Boolean(errors.cpf)} helperText={errors.cpf} /></Grid>
            <Grid size={{ xs: 12, md: 4 }}><Input label="CNPJ" value={form.cnpj} onChange={(event) => update("cnpj", formatCnpj(event.target.value))} error={Boolean(errors.cnpj)} helperText={errors.cnpj} /></Grid>
            <Grid size={{ xs: 12, md: 4 }}><Input label="RG" value={form.rg} onChange={(event) => update("rg", event.target.value)} /></Grid>
            <Grid size={{ xs: 12, md: 4 }}><Input label="Telefone" value={form.telefone} onChange={(event) => update("telefone", formatPhone(event.target.value))} /></Grid>
            <Grid size={{ xs: 12, md: 4 }}><Input label="Celular" value={form.celular} onChange={(event) => update("celular", formatPhone(event.target.value))} /></Grid>
            <Grid size={{ xs: 12, md: 4 }}><Input label="WhatsApp" value={form.whatsapp} onChange={(event) => update("whatsapp", formatPhone(event.target.value))} /></Grid>
            <Grid size={{ xs: 12 }}><Input type="email" label="E-mail" value={form.email} onChange={(event) => update("email", event.target.value)} /></Grid>
          </Grid>
        </Card>

        <Card>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>Endereço</Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 3 }}><Input label="CEP" value={form.cep} onChange={(event) => handleCep(event.target.value)} error={Boolean(errors.cep)} helperText={errors.cep} InputProps={{ endAdornment: cepLoading ? <InputAdornment position="end"><CircularProgress size={18} /></InputAdornment> : null }} /></Grid>
            <Grid size={{ xs: 12, md: 7 }}><Input label="Rua" value={form.rua} onChange={(event) => update("rua", event.target.value)} /></Grid>
            <Grid size={{ xs: 12, md: 2 }}><Input label="Número" value={form.numero} onChange={(event) => update("numero", event.target.value)} /></Grid>
            <Grid size={{ xs: 12, md: 4 }}><Input label="Complemento" value={form.complemento} onChange={(event) => update("complemento", event.target.value)} /></Grid>
            <Grid size={{ xs: 12, md: 3 }}><Input label="Bairro" value={form.bairro} onChange={(event) => update("bairro", event.target.value)} /></Grid>
            <Grid size={{ xs: 12, md: 3 }}><Input label="Cidade" value={form.cidade} onChange={(event) => update("cidade", event.target.value)} /></Grid>
            <Grid size={{ xs: 12, md: 2 }}><Input label="UF" value={form.estado} onChange={(event) => update("estado", event.target.value.replace(/[^a-z]/gi, "").slice(0, 2).toUpperCase())} error={Boolean(errors.estado)} helperText={errors.estado} /></Grid>
            <Grid size={{ xs: 12 }}><Input multiline rows={3} label="Observações" value={form.observacoes} onChange={(event) => update("observacoes", event.target.value)} /></Grid>
          </Grid>
        </Card>
      </Stack>
    </MainLayout>
  );
}
