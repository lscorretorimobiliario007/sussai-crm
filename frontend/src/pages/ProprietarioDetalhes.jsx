import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Box, Chip, Grid, Stack, Typography } from "@mui/material";
import { ArrowBack, EditOutlined, HomeWorkOutlined, NoteAddOutlined, UploadFileOutlined } from "@mui/icons-material";
import MainLayout from "../components/layout/MainLayout";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Loading from "../components/ui/Loading";
import { useToast } from "../components/ui/Toast";
import api from "../api/axios";
import { formatCurrency, formatDateTime } from "../utils/formatters";
import { TIPOS_PESSOA, optionLabel, statusMeta } from "../utils/clientes";

export default function ProprietarioDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await api.get(`/proprietarios/${id}`);
      setItem(response.data);
    } catch (error) {
      toast.error(error.response?.data?.erro || "Erro ao carregar proprietário.");
      navigate("/proprietarios");
    } finally {
      setLoading(false);
    }
  }, [id, navigate, toast]);

  useEffect(() => { load(); }, [load]);

  const saveNote = async () => {
    if (!note.trim()) return;
    setBusy(true);
    try {
      await api.post(`/proprietarios/${id}/anotacoes`, { conteudo: note.trim() });
      setNote("");
      toast.success("Anotação salva.");
      load();
    } catch (error) {
      toast.error(error.response?.data?.erro || "Erro ao anotar.");
    } finally {
      setBusy(false);
    }
  };

  const uploadDocuments = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const formData = new FormData();
    files.forEach((file) => formData.append("documentos", file));
    setBusy(true);
    try {
      await api.post(`/clientes/${id}/documentos`, formData);
      toast.success("Documentos enviados.");
      load();
    } catch (error) {
      toast.error(error.response?.data?.erro || "Erro ao enviar documentos.");
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  };

  if (loading || !item) return <MainLayout title="Proprietário"><Loading variant="skeleton" rows={8} /></MainLayout>;
  const status = statusMeta(item.status);
  const dash = item.dashboard || {};

  return (
    <MainLayout title={item.nome}>
      <Stack spacing={3}>
        <Stack direction={{ xs: "column", lg: "row" }} justifyContent="space-between" gap={2}>
          <Box>
            <Button color="inherit" startIcon={<ArrowBack />} onClick={() => navigate("/proprietarios")}>Voltar</Button>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.5, mb: 1 }}>
              <Chip size="small" label={status.label} color={status.color} sx={{ fontWeight: 750 }} />
              <Chip size="small" variant="outlined" label={optionLabel(TIPOS_PESSOA, item.tipoPessoa)} />
              {!item.ativo && <Chip size="small" label="Inativo" />}
            </Stack>
            <Typography variant="h4" fontWeight={900}>{item.nome}</Typography>
            <Typography color="text.secondary">{item.corretor?.nome || "Sem corretor"} · {item.email || "Sem e-mail"}</Typography>
          </Box>
          {item.ativo && (
            <Button variant="contained" startIcon={<EditOutlined />} onClick={() => navigate(`/proprietarios/${id}/editar`)}>Editar</Button>
          )}
        </Stack>

        <Grid container spacing={2}>
          {[
            { label: "Imóveis", value: dash.imoveis ?? 0 },
            { label: "Contratos ativos", value: dash.contratosAtivos ?? 0 },
            { label: "Valor venda", value: formatCurrency(dash.valorVenda) },
            { label: "Valor aluguel", value: formatCurrency(dash.valorAluguel) },
          ].map((card) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={card.label}>
              <Card contentSx={{ p: 2 }}>
                <Typography variant="caption" color="text.secondary">{card.label}</Typography>
                <Typography variant="h6" fontWeight={850}>{card.value}</Typography>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Stack spacing={2.5}>
              <Card>
                <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>Cadastro</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}><Typography variant="caption" color="text.secondary">Documento</Typography><Typography fontWeight={750}>{item.cpfCnpj || "—"}</Typography></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><Typography variant="caption" color="text.secondary">Telefone</Typography><Typography fontWeight={750}>{item.telefone || "—"}</Typography></Grid>
                  <Grid size={{ xs: 12 }}><Typography variant="caption" color="text.secondary">Endereço</Typography><Typography fontWeight={750}>{[item.endereco, item.cidade, item.estado].filter(Boolean).join(" — ") || "—"}</Typography></Grid>
                </Grid>
              </Card>

              <Card>
                <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>Dados bancários</Typography>
                {(item.dadosBancarios || []).length === 0 && <Typography color="text.secondary">Nenhuma conta cadastrada.</Typography>}
                {(item.dadosBancarios || []).map((conta) => (
                  <Box key={conta.id} sx={{ mb: 1.5 }}>
                    <Typography fontWeight={800}>{conta.banco} {conta.principal ? "· principal" : ""}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Ag {conta.agencia || "—"} · Cc {conta.conta || "—"} · PIX {conta.pix || "—"}
                    </Typography>
                  </Box>
                ))}
              </Card>

              <Card>
                <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>Contatos</Typography>
                {(item.telefones || []).length === 0 && (item.emails || []).length === 0 && (
                  <Typography color="text.secondary">Nenhum contato adicional.</Typography>
                )}
                {(item.telefones || []).map((tel) => (
                  <Typography key={`t-${tel.id}`} variant="body2" sx={{ mb: 0.5 }}>
                    {tel.numero} {tel.principal ? "· principal" : ""} {tel.whatsapp ? "· WhatsApp" : ""}
                  </Typography>
                ))}
                {(item.emails || []).map((email) => (
                  <Typography key={`e-${email.id}`} variant="body2" sx={{ mb: 0.5 }}>
                    {email.email} {email.principal ? "· principal" : ""}
                  </Typography>
                ))}
              </Card>

              <Card>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="h6" fontWeight={800}>Documentos</Typography>
                  {item.ativo && (
                    <Button component="label" size="small" variant="outlined" startIcon={<UploadFileOutlined />} disabled={busy}>
                      Upload
                      <input hidden type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx" onChange={uploadDocuments} />
                    </Button>
                  )}
                </Stack>
                {(item.documentos || []).length === 0 && <Typography color="text.secondary">Nenhum documento anexado.</Typography>}
                {(item.documentos || []).map((doc) => (
                  <Box key={doc.id} sx={{ mb: 1 }}>
                    <Typography fontWeight={750}>{doc.nomeOriginal || doc.nome || "Documento"}</Typography>
                    <Typography variant="caption" color="text.secondary">{formatDateTime(doc.createdAt)}</Typography>
                  </Box>
                ))}
              </Card>

              <Card>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <HomeWorkOutlined color="primary" />
                  <Typography variant="h6" fontWeight={800}>Imóveis vinculados</Typography>
                </Stack>
                <Stack spacing={1}>
                  {(item.imoveisProprietario || []).map((imovel) => (
                    <Box key={imovel.id} sx={{ cursor: "pointer" }} onClick={() => navigate(`/imoveis/${imovel.id}`)}>
                      <Typography fontWeight={750}>{imovel.codigo} — {imovel.titulo}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {imovel.status} · {imovel.cidade} · {formatCurrency(imovel.valorVenda || imovel.valorAluguel)}
                      </Typography>
                    </Box>
                  ))}
                  {(item.imoveisProprietario || []).length === 0 && <Typography color="text.secondary">Nenhum imóvel vinculado.</Typography>}
                </Stack>
              </Card>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }}>
            <Stack spacing={2.5}>
              <Card>
                <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>Anotações</Typography>
                <Stack spacing={1} sx={{ mb: 1.5 }}>
                  <Input multiline rows={2} label="Nova anotação" value={note} onChange={(event) => setNote(event.target.value)} />
                  <Button variant="contained" startIcon={<NoteAddOutlined />} loading={busy} onClick={saveNote}>Salvar</Button>
                </Stack>
                {(item.anotacoes || []).map((anotacao) => (
                  <Box key={anotacao.id} sx={{ mb: 1.25, p: 1.25, borderRadius: 2, bgcolor: "action.hover" }}>
                    <Typography variant="body2">{anotacao.conteudo}</Typography>
                    <Typography variant="caption" color="text.secondary">{anotacao.usuario?.nome} · {formatDateTime(anotacao.createdAt)}</Typography>
                  </Box>
                ))}
              </Card>
              <Card>
                <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>Histórico</Typography>
                {(item.historico || []).map((hist) => (
                  <Box key={hist.id} sx={{ mb: 1 }}>
                    <Typography fontWeight={750}>{hist.acao}</Typography>
                    <Typography variant="caption" color="text.secondary">{hist.usuario?.nome} · {formatDateTime(hist.createdAt)}</Typography>
                  </Box>
                ))}
              </Card>
            </Stack>
          </Grid>
        </Grid>
      </Stack>
    </MainLayout>
  );
}
