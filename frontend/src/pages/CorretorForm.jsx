import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Box, Chip, Grid, Stack, Typography } from "@mui/material";
import { ArrowBack, SaveOutlined } from "@mui/icons-material";
import MainLayout from "../components/layout/MainLayout";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Loading from "../components/ui/Loading";
import Select from "../components/ui/Select";
import { useToast } from "../components/ui/Toast";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

const PERMISSOES = [
  { value: "imoveis", label: "Imóveis" },
  { value: "clientes", label: "Clientes" },
  { value: "proprietarios", label: "Proprietários" },
  { value: "leads", label: "Pipeline" },
  { value: "agenda", label: "Agenda" },
  { value: "contratos", label: "Contratos" },
  { value: "tarefas", label: "Tarefas" },
];

const emptyForm = {
  nome: "", email: "", telefone: "", senha: "", tipo: "CORRETOR",
  creci: "", crea: "", comissaoPadrao: 5, metaMensal: "", statusCorretor: "ATIVO",
  equipeId: "", permissoes: ["imoveis", "clientes", "leads", "agenda", "tarefas"],
};

export default function CorretorForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();
  const { usuario } = useAuth();
  const canManage = ["ADMIN", "GERENTE"].includes(usuario?.tipo);
  const [form, setForm] = useState(emptyForm);
  const [options, setOptions] = useState({ equipes: [], status: [], tipos: [] });
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [equipeNome, setEquipeNome] = useState("");

  const load = useCallback(async () => {
    try {
      const requests = [api.get("/corretores/opcoes")];
      if (editing) requests.push(api.get(`/corretores/${id}`));
      const [opts, detail] = await Promise.all(requests);
      setOptions(opts.data);
      if (detail) {
        const data = detail.data;
        setForm({
          ...emptyForm,
          nome: data.nome || "",
          email: data.email || "",
          telefone: data.telefone || "",
          senha: "",
          tipo: data.tipo || "CORRETOR",
          creci: data.creci || "",
          crea: data.crea || "",
          comissaoPadrao: data.comissaoPadrao ?? 5,
          metaMensal: data.metaMensal ?? "",
          statusCorretor: data.statusCorretor || "ATIVO",
          equipeId: data.equipeId ? String(data.equipeId) : "",
          permissoes: data.permissoes || [],
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.erro || "Erro ao carregar.");
      navigate("/corretores");
    } finally {
      setLoading(false);
    }
  }, [editing, id, navigate, toast]);

  useEffect(() => { load(); }, [load]);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const togglePerm = (value) => {
    setForm((current) => ({
      ...current,
      permissoes: current.permissoes.includes(value)
        ? current.permissoes.filter((item) => item !== value)
        : [...current.permissoes, value],
    }));
  };

  const createEquipe = async () => {
    if (!equipeNome.trim()) return;
    try {
      const response = await api.post("/corretores/equipes", { nome: equipeNome.trim() });
      setOptions((current) => ({ ...current, equipes: [...(current.equipes || []), response.data] }));
      update("equipeId", response.data.id);
      setEquipeNome("");
      toast.success("Equipe criada.");
    } catch (error) {
      toast.error(error.response?.data?.erro || "Erro ao criar equipe.");
    }
  };

  const save = async () => {
    if (!form.nome.trim() || !form.email.trim()) {
      toast.error("Nome e e-mail são obrigatórios.");
      return;
    }
    if (!editing && !form.senha) {
      toast.error("Informe a senha inicial.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        comissaoPadrao: Number(form.comissaoPadrao),
        metaMensal: form.metaMensal === "" ? null : Number(form.metaMensal),
        equipeId: form.equipeId ? Number(form.equipeId) : null,
      };
      if (!payload.senha) delete payload.senha;
      const response = editing
        ? await api.put(`/corretores/${id}`, payload)
        : await api.post("/corretores", payload);
      toast.success(editing ? "Corretor atualizado." : "Corretor cadastrado.");
      navigate(`/corretores/${response.data.id}`);
    } catch (error) {
      toast.error(error.response?.data?.erro || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!loading && !canManage && !editing) navigate("/corretores");
  }, [loading, canManage, editing, navigate]);

  if (loading) return <MainLayout title="Corretor"><Loading variant="skeleton" rows={8} /></MainLayout>;
  if (!canManage && !editing) return null;

  return (
    <MainLayout title={editing ? "Editar corretor" : "Novo corretor"}>
      <Stack spacing={3}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={2}>
          <Box>
            <Button color="inherit" startIcon={<ArrowBack />} onClick={() => navigate(editing ? `/corretores/${id}` : "/corretores")}>Voltar</Button>
            <Typography variant="h5" fontWeight={850} sx={{ mt: 1 }}>{editing ? "Editar corretor" : "Cadastro de corretor"}</Typography>
          </Box>
          <Button variant="contained" size="large" startIcon={<SaveOutlined />} loading={saving} onClick={save}>Salvar</Button>
        </Stack>

        <Card>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}><Input label="Nome" value={form.nome} onChange={(event) => update("nome", event.target.value)} /></Grid>
            <Grid size={{ xs: 12, md: 6 }}><Input label="E-mail" value={form.email} onChange={(event) => update("email", event.target.value)} /></Grid>
            <Grid size={{ xs: 12, md: 4 }}><Input label="Telefone" value={form.telefone} onChange={(event) => update("telefone", event.target.value)} /></Grid>
            <Grid size={{ xs: 12, md: 4 }}><Input label="CRECI" value={form.creci} onChange={(event) => update("creci", event.target.value)} /></Grid>
            <Grid size={{ xs: 12, md: 4 }}><Input label="CREA" value={form.crea} onChange={(event) => update("crea", event.target.value)} /></Grid>
            <Grid size={{ xs: 12, md: 4 }}><Input type="password" label={editing ? "Nova senha (opcional)" : "Senha"} value={form.senha} onChange={(event) => update("senha", event.target.value)} /></Grid>
            {canManage && (
              <>
                <Grid size={{ xs: 12, md: 4 }}><Select label="Tipo" value={form.tipo} options={[{ value: "CORRETOR", label: "Corretor" }, { value: "GERENTE", label: "Gerente" }, ...(usuario?.tipo === "ADMIN" ? [{ value: "ADMIN", label: "Admin" }] : [])]} onChange={(event) => update("tipo", event.target.value)} /></Grid>
                <Grid size={{ xs: 12, md: 4 }}><Select label="Status" value={form.statusCorretor} options={[{ value: "ATIVO", label: "Ativo" }, { value: "FERIAS", label: "Férias" }, { value: "INATIVO", label: "Inativo" }]} onChange={(event) => update("statusCorretor", event.target.value)} /></Grid>
                <Grid size={{ xs: 12, md: 4 }}><Input type="number" label="Comissão padrão %" value={form.comissaoPadrao} onChange={(event) => update("comissaoPadrao", event.target.value)} /></Grid>
                <Grid size={{ xs: 12, md: 4 }}><Input type="number" label="Meta mensal (R$)" value={form.metaMensal} onChange={(event) => update("metaMensal", event.target.value)} /></Grid>
                <Grid size={{ xs: 12, md: 4 }}><Select label="Equipe" value={form.equipeId} options={[{ value: "", label: "Sem equipe" }, ...(options.equipes || []).map((item) => ({ value: String(item.id), label: item.nome }))]} onChange={(event) => update("equipeId", event.target.value)} /></Grid>
                <Grid size={{ xs: 12, md: 8 }}>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                    <Input label="Nova equipe" value={equipeNome} onChange={(event) => setEquipeNome(event.target.value)} />
                    <Button variant="outlined" onClick={createEquipe}>Criar equipe</Button>
                  </Stack>
                </Grid>
                <Grid size={12}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Permissões</Typography>
                  <Stack direction="row" flexWrap="wrap" gap={1}>
                    {PERMISSOES.map((item) => (
                      <Chip
                        key={item.value}
                        label={item.label}
                        clickable
                        color={form.permissoes.includes(item.value) ? "primary" : "default"}
                        variant={form.permissoes.includes(item.value) ? "filled" : "outlined"}
                        onClick={() => togglePerm(item.value)}
                      />
                    ))}
                  </Stack>
                </Grid>
              </>
            )}
          </Grid>
        </Card>
      </Stack>
    </MainLayout>
  );
}
