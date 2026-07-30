import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { Add, Check, Delete } from "@mui/icons-material";
import MainLayout from "../components/layout/MainLayout";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import EmptyState from "../components/ui/EmptyState";
import Loading from "../components/ui/Loading";
import { useToast } from "../components/ui/Toast";
import api from "../api/axios";
import { formatDate, PRIORIDADE_TAREFA } from "../utils/formatters";

const STATUS_TAREFA = {
  PENDENTE: { label: "Pendente", color: "warning" },
  EM_ANDAMENTO: { label: "Em Andamento", color: "info" },
  CONCLUIDA: { label: "Concluída", color: "success" },
  CANCELADA: { label: "Cancelada", color: "default" },
};

const emptyForm = {
  titulo: "",
  descricao: "",
  dataLimite: "",
  prioridade: "MEDIA",
  status: "PENDENTE",
};

export default function Tarefas() {
  const toast = useToast();
  const [tarefas, setTarefas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/tarefas");
      setTarefas(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch (error) {
      toast.error(error.response?.data?.erro || "Erro ao carregar tarefas.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { carregar(); }, [carregar]);

  const salvar = async () => {
    if (!form.titulo.trim()) {
      toast.error("Informe o título da tarefa.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/tarefas", {
        ...form,
        dataLimite: form.dataLimite ? new Date(form.dataLimite).toISOString() : null,
      });
      setOpen(false);
      setForm(emptyForm);
      toast.success("Tarefa criada com sucesso.");
      await carregar();
    } catch (error) {
      toast.error(error.response?.data?.erro || "Erro ao salvar tarefa.");
    } finally {
      setSaving(false);
    }
  };

  const concluir = async (id) => {
    try {
      await api.put(`/tarefas/${id}`, { status: "CONCLUIDA" });
      toast.success("Tarefa concluída.");
      await carregar();
    } catch (error) {
      toast.error(error.response?.data?.erro || "Erro ao concluir tarefa.");
    }
  };

  const excluir = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/tarefas/${deleteId}`);
      setDeleteId(null);
      toast.success("Tarefa excluída.");
      await carregar();
    } catch (error) {
      toast.error(error.response?.data?.erro || "Erro ao excluir tarefa.");
    }
  };

  return (
    <MainLayout title="Tarefas">
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>
          Nova Tarefa
        </Button>
      </Box>

      <Card>
        {loading ? (
          <Loading variant="skeleton" rows={5} />
        ) : tarefas.length === 0 ? (
          <EmptyState
            title="Nenhuma tarefa"
            description="Organize prazos e follow-ups da equipe."
            actionLabel="Nova tarefa"
            onAction={() => setOpen(true)}
          />
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Título</TableCell>
                  <TableCell>Responsável</TableCell>
                  <TableCell>Prioridade</TableCell>
                  <TableCell>Prazo</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tarefas.map((t) => (
                  <TableRow key={t.id} hover>
                    <TableCell>
                      <Typography fontWeight={600}>{t.titulo}</Typography>
                      {t.descricao && <Typography variant="caption" color="text.secondary">{t.descricao}</Typography>}
                    </TableCell>
                    <TableCell>{t.usuario?.nome}</TableCell>
                    <TableCell>
                      <Chip label={PRIORIDADE_TAREFA[t.prioridade]?.label} color={PRIORIDADE_TAREFA[t.prioridade]?.color} size="small" />
                    </TableCell>
                    <TableCell>{formatDate(t.dataLimite)}</TableCell>
                    <TableCell>
                      <Chip label={STATUS_TAREFA[t.status]?.label} color={STATUS_TAREFA[t.status]?.color} size="small" />
                    </TableCell>
                    <TableCell align="right">
                      {t.status !== "CONCLUIDA" && (
                        <IconButton color="success" size="small" aria-label="Concluir tarefa" onClick={() => concluir(t.id)}>
                          <Check />
                        </IconButton>
                      )}
                      <IconButton color="error" size="small" aria-label="Excluir tarefa" onClick={() => setDeleteId(t.id)}>
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nova Tarefa</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth required label="Título" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth multiline rows={3} label="Descrição" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth type="date" label="Prazo" slotProps={{ inputLabel: { shrink: true } }} value={form.dataLimite} onChange={(e) => setForm({ ...form, dataLimite: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth select label="Prioridade" value={form.prioridade} onChange={(e) => setForm({ ...form, prioridade: e.target.value })}>
                {Object.entries(PRIORIDADE_TAREFA).map(([k, v]) => <MenuItem key={k} value={k}>{v.label}</MenuItem>)}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" loading={saving} onClick={salvar}>Criar</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Excluir tarefa?"
        description="Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        onClose={() => setDeleteId(null)}
        onConfirm={excluir}
      />
    </MainLayout>
  );
}
