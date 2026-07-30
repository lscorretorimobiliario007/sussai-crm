import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box, FormControlLabel, Grid, IconButton, Stack, Switch, Typography,
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
import { STATUS_CLIENTE, TIPOS_PESSOA } from "../utils/clientes";

const emptyForm = {
  tipoPessoa: "PF", status: "CLIENTE", nome: "", razaoSocial: "", nomeFantasia: "",
  cpfCnpj: "", email: "", telefone: "", whatsapp: "", endereco: "", cidade: "", estado: "",
  notas: "", origem: "", corretorId: "",
};
const emptyBank = {
  banco: "", agencia: "", conta: "", tipoConta: "CORRENTE", pix: "", titular: "", documentoTitular: "", principal: true,
};

export default function ProprietarioForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState(emptyForm);
  const [contas, setContas] = useState([{ ...emptyBank }]);
  const [options, setOptions] = useState({ corretores: [], tiposConta: [] });
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const requests = [api.get("/proprietarios/opcoes")];
      if (editing) requests.push(api.get(`/proprietarios/${id}`));
      const [opts, detail] = await Promise.all(requests);
      setOptions(opts.data);
      if (detail) {
        if (detail.data.ativo === false) {
          toast.error("Reative antes de editar.");
          navigate(`/proprietarios/${id}`);
          return;
        }
        const data = detail.data;
        setForm({
          ...emptyForm,
          tipoPessoa: data.tipoPessoa || "PF",
          status: data.status || "CLIENTE",
          nome: data.nome || "",
          razaoSocial: data.razaoSocial || "",
          nomeFantasia: data.nomeFantasia || "",
          cpfCnpj: data.cpfCnpj || "",
          email: data.email || "",
          telefone: data.telefone || "",
          whatsapp: data.whatsapp || "",
          endereco: data.endereco || "",
          cidade: data.cidade || "",
          estado: data.estado || "",
          notas: data.notas || "",
          origem: data.origem || "",
          corretorId: data.corretorId || "",
        });
        setContas(data.dadosBancarios?.length
          ? data.dadosBancarios.map((item) => ({
            banco: item.banco || "",
            agencia: item.agencia || "",
            conta: item.conta || "",
            tipoConta: item.tipoConta || "CORRENTE",
            pix: item.pix || "",
            titular: item.titular || "",
            documentoTitular: item.documentoTitular || "",
            principal: item.principal,
          }))
          : [{ ...emptyBank }]);
      }
    } catch (error) {
      toast.error(error.response?.data?.erro || "Erro ao carregar formulário.");
      navigate("/proprietarios");
    } finally {
      setLoading(false);
    }
  }, [editing, id, navigate, toast]);

  useEffect(() => { load(); }, [load]);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const save = async () => {
    if (!form.nome.trim()) {
      toast.error("Informe o nome.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        corretorId: form.corretorId ? Number(form.corretorId) : null,
        cpfCnpj: form.cpfCnpj.replace(/\D/g, ""),
        estado: form.estado.toUpperCase(),
      };
      const response = editing
        ? await api.put(`/proprietarios/${id}`, payload)
        : await api.post("/proprietarios", payload);
      const proprietarioId = response.data.id;
      await api.put(`/proprietarios/${proprietarioId}/dados-bancarios`, {
        contas: contas.filter((item) => item.banco.trim()),
      });
      await api.put(`/clientes/${proprietarioId}/contatos`, {
        telefones: form.telefone ? [{ numero: form.telefone, tipo: "CELULAR", principal: true }] : [],
        emails: form.email ? [{ email: form.email, tipo: "OUTRO", principal: true }] : [],
        enderecos: form.endereco && form.cidade && form.estado
          ? [{
            tipo: "RESIDENCIAL",
            logradouro: form.endereco,
            cidade: form.cidade,
            estado: form.estado,
            principal: true,
          }]
          : [],
      });
      toast.success(editing ? "Proprietário atualizado." : "Proprietário cadastrado.");
      navigate(`/proprietarios/${proprietarioId}`);
    } catch (error) {
      toast.error(error.response?.data?.erro || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <MainLayout title="Proprietário"><Loading variant="skeleton" rows={8} /></MainLayout>;

  const tiposConta = (options.tiposConta || ["CORRENTE", "POUPANCA", "PAGAMENTO"]).map((item) => (
    typeof item === "string" ? { value: item, label: item } : item
  ));

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
            <Grid size={{ xs: 12, md: 4 }}><Select label="Pessoa" value={form.tipoPessoa} options={TIPOS_PESSOA} onChange={(event) => update("tipoPessoa", event.target.value)} /></Grid>
            <Grid size={{ xs: 12, md: 4 }}><Select label="Status" value={form.status} options={STATUS_CLIENTE} onChange={(event) => update("status", event.target.value)} /></Grid>
            <Grid size={{ xs: 12, md: 4 }}><Select label="Corretor" value={form.corretorId} options={[{ value: "", label: "Selecionar" }, ...(options.corretores || []).map((item) => ({ value: item.id, label: item.nome }))]} onChange={(event) => update("corretorId", event.target.value)} /></Grid>
            <Grid size={{ xs: 12, md: 6 }}><Input label="Nome" value={form.nome} onChange={(event) => update("nome", event.target.value)} required /></Grid>
            <Grid size={{ xs: 12, md: 6 }}><Input label="CPF/CNPJ" value={form.cpfCnpj} onChange={(event) => update("cpfCnpj", event.target.value)} /></Grid>
            {form.tipoPessoa === "PJ" && (
              <>
                <Grid size={{ xs: 12, md: 6 }}><Input label="Razão social" value={form.razaoSocial} onChange={(event) => update("razaoSocial", event.target.value)} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><Input label="Nome fantasia" value={form.nomeFantasia} onChange={(event) => update("nomeFantasia", event.target.value)} /></Grid>
              </>
            )}
            <Grid size={{ xs: 12, md: 4 }}><Input label="E-mail" value={form.email} onChange={(event) => update("email", event.target.value)} /></Grid>
            <Grid size={{ xs: 12, md: 4 }}><Input label="Telefone" value={form.telefone} onChange={(event) => update("telefone", event.target.value)} /></Grid>
            <Grid size={{ xs: 12, md: 4 }}><Input label="WhatsApp" value={form.whatsapp} onChange={(event) => update("whatsapp", event.target.value)} /></Grid>
            <Grid size={{ xs: 12, md: 6 }}><Input label="Endereço" value={form.endereco} onChange={(event) => update("endereco", event.target.value)} /></Grid>
            <Grid size={{ xs: 12, md: 3 }}><Input label="Cidade" value={form.cidade} onChange={(event) => update("cidade", event.target.value)} /></Grid>
            <Grid size={{ xs: 12, md: 3 }}><Input label="UF" value={form.estado} onChange={(event) => update("estado", event.target.value)} slotProps={{ htmlInput: { maxLength: 2 } }} /></Grid>
            <Grid size={{ xs: 12 }}><Input multiline rows={3} label="Observações" value={form.notas} onChange={(event) => update("notas", event.target.value)} /></Grid>
          </Grid>
        </Card>

        <Card>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6" fontWeight={800}>Dados bancários</Typography>
            <Button startIcon={<Add />} onClick={() => setContas((current) => [...current, { ...emptyBank, principal: false }])}>Adicionar</Button>
          </Stack>
          <Stack spacing={2}>
            {contas.map((item, index) => (
              <Box key={`bank-${index}`} sx={{ p: 2, border: 1, borderColor: "divider", borderRadius: 2 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid size={{ xs: 12, md: 4 }}><Input label="Banco" value={item.banco} onChange={(event) => setContas((current) => current.map((row, i) => (i === index ? { ...row, banco: event.target.value } : row)))} /></Grid>
                  <Grid size={{ xs: 6, md: 2 }}><Input label="Agência" value={item.agencia} onChange={(event) => setContas((current) => current.map((row, i) => (i === index ? { ...row, agencia: event.target.value } : row)))} /></Grid>
                  <Grid size={{ xs: 6, md: 2 }}><Input label="Conta" value={item.conta} onChange={(event) => setContas((current) => current.map((row, i) => (i === index ? { ...row, conta: event.target.value } : row)))} /></Grid>
                  <Grid size={{ xs: 12, md: 2 }}><Select label="Tipo" value={item.tipoConta} options={tiposConta} onChange={(event) => setContas((current) => current.map((row, i) => (i === index ? { ...row, tipoConta: event.target.value } : row)))} /></Grid>
                  <Grid size={{ xs: 12, md: 4 }}><Input label="PIX" value={item.pix} onChange={(event) => setContas((current) => current.map((row, i) => (i === index ? { ...row, pix: event.target.value } : row)))} /></Grid>
                  <Grid size={{ xs: 12, md: 4 }}><Input label="Titular" value={item.titular} onChange={(event) => setContas((current) => current.map((row, i) => (i === index ? { ...row, titular: event.target.value } : row)))} /></Grid>
                  <Grid size={{ xs: 8, md: 3 }}>
                    <FormControlLabel
                      control={<Switch checked={item.principal} onChange={(event) => setContas((current) => current.map((row, i) => ({ ...row, principal: i === index ? event.target.checked : false })))} />}
                      label="Principal"
                    />
                  </Grid>
                  <Grid size={{ xs: 4, md: 1 }}>
                    <IconButton color="error" disabled={contas.length === 1} onClick={() => setContas((current) => current.filter((_, i) => i !== index))}><DeleteOutlined /></IconButton>
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
