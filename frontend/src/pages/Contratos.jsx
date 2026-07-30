import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { Add } from "@mui/icons-material";
import MainLayout from "../components/layout/MainLayout";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import Loading from "../components/ui/Loading";
import { useToast } from "../components/ui/Toast";
import api from "../api/axios";
import { formatCurrency, formatDate, TIPO_CONTRATO } from "../utils/formatters";

const STATUS_CONTRATO = {
  RASCUNHO: { label: "Rascunho", color: "default" },
  ATIVO: { label: "Ativo", color: "success" },
  ENCERRADO: { label: "Encerrado", color: "info" },
  CANCELADO: { label: "Cancelado", color: "error" },
};

const emptyForm = {
  tipo: "ALUGUEL",
  status: "RASCUNHO",
  valor: "",
  comissao: "",
  dataInicio: "",
  dataFim: "",
  diaVencimento: 10,
  imovelId: "",
  clienteId: "",
  proprietarioId: "",
  observacoes: "",
};

export default function Contratos() {
  const toast = useToast();
  const [contratos, setContratos] = useState([]);
  const [imoveis, setImoveis] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/contratos");
      setContratos(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch (error) {
      toast.error(error.response?.data?.erro || "Erro ao carregar contratos.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    carregar();
    api.get("/imoveis", { params: { limit: 100 } }).then((res) => setImoveis(res.data?.data || [])).catch(() => {});
    api.get("/clientes", { params: { limit: 100 } }).then((res) => setClientes(res.data?.data || [])).catch(() => {});
  }, [carregar]);

  const salvar = async () => {
    if (!form.imovelId || !form.clienteId || !form.valor || !form.dataInicio) {
      toast.error("Preencha imóvel, cliente, valor e data inicial.");
      return;
    }

    setSaving(true);
    try {
      await api.post("/contratos", {
        ...form,
        valor: Number(form.valor),
        comissao: form.comissao ? Number(form.comissao) : null,
        imovelId: Number(form.imovelId),
        clienteId: Number(form.clienteId),
        proprietarioId: form.proprietarioId ? Number(form.proprietarioId) : null,
        dataInicio: new Date(form.dataInicio).toISOString(),
        dataFim: form.dataFim ? new Date(form.dataFim).toISOString() : null,
      });
      setOpen(false);
      setForm(emptyForm);
      toast.success("Contrato criado com sucesso.");
      await carregar();
    } catch (error) {
      toast.error(error.response?.data?.erro || "Erro ao criar contrato.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout title="Contratos">
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>
          Novo Contrato
        </Button>
      </Box>

      <Card>
        {loading ? (
          <Loading variant="skeleton" rows={6} />
        ) : contratos.length === 0 ? (
          <EmptyState
            title="Nenhum contrato"
            description="Registre locações, vendas e administração."
            actionLabel="Novo contrato"
            onAction={() => setOpen(true)}
          />
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Número</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Imóvel</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Valor</TableCell>
                  <TableCell>Início</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {contratos.map((c) => (
                  <TableRow key={c.id} hover>
                    <TableCell><Typography fontWeight={600}>{c.numero}</Typography></TableCell>
                    <TableCell>{TIPO_CONTRATO[c.tipo]}</TableCell>
                    <TableCell>{c.imovel?.codigo} — {c.imovel?.titulo}</TableCell>
                    <TableCell>{c.cliente?.nome}</TableCell>
                    <TableCell>{formatCurrency(c.valor)}</TableCell>
                    <TableCell>{formatDate(c.dataInicio)}</TableCell>
                    <TableCell>
                      <Chip label={STATUS_CONTRATO[c.status]?.label} color={STATUS_CONTRATO[c.status]?.color} size="small" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Novo Contrato</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth select label="Tipo" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                {Object.entries(TIPO_CONTRATO).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {Object.entries(STATUS_CONTRATO).map(([k, v]) => <MenuItem key={k} value={k}>{v.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth required label="Valor" type="number" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth required select label="Imóvel" value={form.imovelId} onChange={(e) => setForm({ ...form, imovelId: e.target.value })}>
                {imoveis.map((i) => <MenuItem key={i.id} value={i.id}>{i.codigo} — {i.titulo}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth required select label="Cliente" value={form.clienteId} onChange={(e) => setForm({ ...form, clienteId: e.target.value })}>
                {clientes.map((c) => <MenuItem key={c.id} value={c.id}>{c.nome}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth required type="date" label="Data Início" slotProps={{ inputLabel: { shrink: true } }} value={form.dataInicio} onChange={(e) => setForm({ ...form, dataInicio: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth type="date" label="Data Fim" slotProps={{ inputLabel: { shrink: true } }} value={form.dataFim} onChange={(e) => setForm({ ...form, dataFim: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth label="Dia Vencimento" type="number" value={form.diaVencimento} onChange={(e) => setForm({ ...form, diaVencimento: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth label="Comissão (%)" type="number" value={form.comissao} onChange={(e) => setForm({ ...form, comissao: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth multiline rows={2} label="Observações" value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" loading={saving} onClick={salvar}>Criar Contrato</Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
}
