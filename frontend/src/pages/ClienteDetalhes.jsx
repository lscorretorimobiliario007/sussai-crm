import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Avatar,
  Box,
  Chip,
  Divider,
  Grid,
  IconButton,
  Pagination,
  Stack,
  Typography,
} from "@mui/material";
import {
  ArrowBack,
  DeleteOutlined,
  EditOutlined,
  FavoriteBorder,
  FileDownloadOutlined,
  HistoryOutlined,
  NoteAddOutlined,
  PictureAsPdfOutlined,
  RestartAltOutlined,
  ShareOutlined,
  UploadFileOutlined,
} from "@mui/icons-material";
import MainLayout from "../components/layout/MainLayout";
import AuthenticatedImage from "../components/imoveis/AuthenticatedImage";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Input from "../components/ui/Input";
import Loading from "../components/ui/Loading";
import Select from "../components/ui/Select";
import { useToast } from "../components/ui/Toast";
import api from "../api/axios";
import { formatCurrency, formatDateTime } from "../utils/formatters";
import {
  HISTORY_LABELS,
  INTERESSES_CLIENTE,
  STATUS_PROPOSTA,
  STATUS_VISITA,
  TIPOS_CLIENTE,
  TIPOS_CONTATO,
  TIPOS_DOCUMENTO,
  TIPOS_ENDERECO,
  TIPOS_INTERACAO,
  TIPOS_PESSOA,
  optionLabel,
  statusMeta,
} from "../utils/clientes";

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function SectionTitle({ children, action }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
      <Typography variant="h6" fontWeight={800}>{children}</Typography>
      {action}
    </Stack>
  );
}

export default function ClienteDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [client, setClient] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyMeta, setHistoryMeta] = useState({ page: 1, totalPages: 1 });
  const [historyPage, setHistoryPage] = useState(1);
  const [imoveis, setImoveis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [interaction, setInteraction] = useState({ tipo: "LIGACAO", titulo: "", descricao: "", imovelId: "" });
  const [favoriteImovelId, setFavoriteImovelId] = useState("");
  const [visit, setVisit] = useState({ imovelId: "", dataHora: "", status: "AGENDADA", observacoes: "" });
  const [proposal, setProposal] = useState({ imovelId: "", valor: "", status: "RASCUNHO", observacoes: "" });
  const [docTipo, setDocTipo] = useState("OUTRO");
  const [docNome, setDocNome] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  const load = useCallback(async () => {
    try {
      const [clientResponse, imoveisResponse] = await Promise.all([
        api.get(`/clientes/${id}`),
        api.get("/properties", { params: { limit: 100 } }),
      ]);
      setClient(clientResponse.data);
      setImoveis(imoveisResponse.data?.data || []);
      if (clientResponse.data.tokenCompartilhamento) {
        setShareUrl(`${api.defaults.baseURL}/clientes/compartilhado/${clientResponse.data.tokenCompartilhamento}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.erro || "Erro ao carregar cliente.");
      navigate("/clientes");
    } finally {
      setLoading(false);
    }
  }, [id, navigate, toast]);

  const loadHistory = useCallback(async () => {
    try {
      const response = await api.get(`/clientes/${id}/historico`, {
        params: { page: historyPage, limit: 10 },
      });
      setHistory(response.data.data);
      setHistoryMeta(response.data.meta);
    } catch {
      setHistory([]);
    }
  }, [historyPage, id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadHistory(); }, [loadHistory]);

  const imovelOptions = [
    { value: "", label: "Selecionar imóvel" },
    ...imoveis.map((item) => ({ value: item.id, label: `${item.codigo} — ${item.titulo}` })),
  ];

  const runAction = async (fn, successMessage) => {
    setBusy(true);
    try {
      await fn();
      if (successMessage) toast.success(successMessage);
      await load();
      await loadHistory();
    } catch (error) {
      toast.error(error.response?.data?.erro || "Não foi possível concluir a ação.");
    } finally {
      setBusy(false);
    }
  };

  const addNote = () => runAction(async () => {
    if (!note.trim()) throw { response: { data: { erro: "Escreva a anotação." } } };
    await api.post(`/clientes/${id}/anotacoes`, { conteudo: note.trim() });
    setNote("");
  }, "Anotação registrada.");

  const addInteraction = () => runAction(async () => {
    if (!interaction.titulo.trim()) throw { response: { data: { erro: "Informe o título da interação." } } };
    await api.post(`/clientes/${id}/interacoes`, {
      ...interaction,
      imovelId: interaction.imovelId ? Number(interaction.imovelId) : null,
    });
    setInteraction({ tipo: "LIGACAO", titulo: "", descricao: "", imovelId: "" });
  }, "Interação registrada.");

  const addFavorite = () => runAction(async () => {
    if (!favoriteImovelId) throw { response: { data: { erro: "Selecione um imóvel." } } };
    await api.post(`/clientes/${id}/favoritos`, { imovelId: Number(favoriteImovelId) });
    setFavoriteImovelId("");
  }, "Imóvel favoritado.");

  const removeFavorite = (imovelId) => runAction(async () => {
    await api.delete(`/clientes/${id}/favoritos/${imovelId}`);
  }, "Favorito removido.");

  const addVisit = () => runAction(async () => {
    if (!visit.imovelId || !visit.dataHora) throw { response: { data: { erro: "Informe imóvel e data da visita." } } };
    await api.post(`/clientes/${id}/visitas`, {
      ...visit,
      imovelId: Number(visit.imovelId),
    });
    setVisit({ imovelId: "", dataHora: "", status: "AGENDADA", observacoes: "" });
  }, "Visita registrada.");

  const addProposal = () => runAction(async () => {
    if (!proposal.imovelId || !proposal.valor) throw { response: { data: { erro: "Informe imóvel e valor." } } };
    await api.post(`/clientes/${id}/propostas`, {
      ...proposal,
      imovelId: Number(proposal.imovelId),
      valor: Number(proposal.valor),
    });
    setProposal({ imovelId: "", valor: "", status: "RASCUNHO", observacoes: "" });
  }, "Proposta registrada.");

  const uploadAvatar = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("avatar", file);
    runAction(async () => {
      await api.post(`/clientes/${id}/avatar`, formData);
    }, "Avatar atualizado.");
    event.target.value = "";
  };

  const uploadDocuments = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const formData = new FormData();
    files.forEach((file) => formData.append("documentos", file));
    formData.append("tipo", docTipo);
    if (docNome.trim()) formData.append("nome", docNome.trim());
    runAction(async () => {
      await api.post(`/clientes/${id}/documentos`, formData);
      setDocNome("");
    }, "Documento(s) enviados.");
    event.target.value = "";
  };

  const share = () => runAction(async () => {
    const response = await api.post(`/clientes/${id}/compartilhar`);
    const url = `${api.defaults.baseURL}${response.data.url}`;
    setShareUrl(url);
    await navigator.clipboard?.writeText(url);
  }, "Link de compartilhamento copiado.");

  const exportPdf = async () => {
    try {
      const response = await api.get(`/clientes/${id}/export/pdf`, { responseType: "blob" });
      downloadBlob(response.data, `cliente-${id}.pdf`);
      toast.success("PDF gerado.");
    } catch (error) {
      toast.error(error.response?.data?.erro || "Erro ao exportar PDF.");
    }
  };

  const executeConfirm = async () => {
    setBusy(true);
    try {
      if (confirm.type === "delete") {
        await api.delete(`/clientes/${id}`);
        toast.success("Cliente desativado.");
        navigate("/clientes");
      } else if (confirm.type === "restore") {
        await api.post(`/clientes/${id}/reativar`);
        toast.success("Cliente reativado.");
        await load();
        await loadHistory();
      } else if (confirm.type === "document") {
        await api.delete(`/clientes/${id}/documentos/${confirm.item.id}`);
        toast.success("Documento removido.");
        await load();
        await loadHistory();
      }
      setConfirm(null);
    } catch (error) {
      toast.error(error.response?.data?.erro || "Não foi possível concluir a ação.");
    } finally {
      setBusy(false);
    }
  };

  if (loading || !client) {
    return <MainLayout title="Cliente"><Loading variant="skeleton" rows={8} /></MainLayout>;
  }

  const status = statusMeta(client.status);
  const active = client.ativo !== false;

  return (
    <MainLayout title={client.nome}>
      <Stack spacing={3}>
        <Stack direction={{ xs: "column", lg: "row" }} justifyContent="space-between" gap={2}>
          <Box>
            <Button color="inherit" startIcon={<ArrowBack />} onClick={() => navigate("/clientes")}>Voltar</Button>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1.5 }}>
              <Box sx={{ position: "relative" }}>
                {client.avatarUrl ? (
                  <AuthenticatedImage src={client.avatarUrl} alt={client.nome} sx={{ width: 84, height: 84, borderRadius: "50%" }} />
                ) : (
                  <Avatar sx={{ width: 84, height: 84, bgcolor: "primary.main", fontWeight: 850, fontSize: 32 }}>
                    {client.nome.slice(0, 1).toUpperCase()}
                  </Avatar>
                )}
              </Box>
              <Box>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 0.75 }}>
                  <Chip size="small" label={status.label} color={status.color} sx={{ fontWeight: 750 }} />
                  <Chip size="small" variant="outlined" label={optionLabel(TIPOS_CLIENTE, client.tipo)} />
                  <Chip size="small" variant="outlined" label={optionLabel(TIPOS_PESSOA, client.tipoPessoa)} />
                  {!active && <Chip size="small" color="default" label="Inativo" />}
                </Stack>
                <Typography variant="h4" fontWeight={900}>{client.nome}</Typography>
                <Typography color="text.secondary">
                  {client.corretor?.nome || "Sem corretor"} · {client.origem || "Origem não informada"}
                </Typography>
              </Box>
            </Stack>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {active && (
              <>
                <Button component="label" variant="outlined" startIcon={<UploadFileOutlined />}>
                  Avatar
                  <input hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadAvatar} />
                </Button>
                <Button variant="outlined" startIcon={<ShareOutlined />} onClick={share} loading={busy}>Compartilhar</Button>
                <Button variant="outlined" startIcon={<PictureAsPdfOutlined />} onClick={exportPdf}>PDF</Button>
                <Button variant="contained" startIcon={<EditOutlined />} onClick={() => navigate(`/clientes/${id}/editar`)}>Editar</Button>
                <Button color="error" variant="outlined" startIcon={<DeleteOutlined />} onClick={() => setConfirm({ type: "delete" })}>Desativar</Button>
              </>
            )}
            {!active && (
              <Button variant="contained" startIcon={<RestartAltOutlined />} onClick={() => setConfirm({ type: "restore" })}>Reativar</Button>
            )}
          </Stack>
        </Stack>

        {shareUrl && (
          <Card>
            <Typography variant="body2" color="text.secondary">Link de compartilhamento (interno autenticado)</Typography>
            <Typography fontWeight={700} sx={{ wordBreak: "break-all" }}>{shareUrl}</Typography>
          </Card>
        )}

        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Stack spacing={2.5}>
              <Card>
                <SectionTitle>Perfil comercial</SectionTitle>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}><Typography variant="caption" color="text.secondary">Documento</Typography><Typography fontWeight={750}>{client.cpfCnpj || "—"}</Typography></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><Typography variant="caption" color="text.secondary">E-mail</Typography><Typography fontWeight={750}>{client.email || "—"}</Typography></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><Typography variant="caption" color="text.secondary">Telefone</Typography><Typography fontWeight={750}>{client.telefone || "—"}</Typography></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><Typography variant="caption" color="text.secondary">WhatsApp</Typography><Typography fontWeight={750}>{client.whatsapp || "—"}</Typography></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><Typography variant="caption" color="text.secondary">Cidade</Typography><Typography fontWeight={750}>{[client.cidade, client.estado].filter(Boolean).join(" / ") || "—"}</Typography></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><Typography variant="caption" color="text.secondary">Faixa de preço</Typography><Typography fontWeight={750}>{formatCurrency(client.faixaPrecoMin)} – {formatCurrency(client.faixaPrecoMax)}</Typography></Grid>
                  {client.razaoSocial && <Grid size={{ xs: 12, sm: 6 }}><Typography variant="caption" color="text.secondary">Razão social</Typography><Typography fontWeight={750}>{client.razaoSocial}</Typography></Grid>}
                  {client.nomeFantasia && <Grid size={{ xs: 12, sm: 6 }}><Typography variant="caption" color="text.secondary">Nome fantasia</Typography><Typography fontWeight={750}>{client.nomeFantasia}</Typography></Grid>}
                  <Grid size={{ xs: 12 }}>
                    <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 0.5 }}>
                      {(client.interesses || []).map((item) => <Chip key={item} label={optionLabel(INTERESSES_CLIENTE, item)} color="primary" variant="outlined" size="small" />)}
                      {(client.tags || []).map((tag) => <Chip key={tag} label={tag} size="small" />)}
                      {(client.cidadesInteresse || []).map((cidade) => <Chip key={cidade} label={cidade} size="small" variant="outlined" />)}
                    </Stack>
                  </Grid>
                  {client.notas && (
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="caption" color="text.secondary">Observações</Typography>
                      <Typography sx={{ whiteSpace: "pre-wrap" }}>{client.notas}</Typography>
                    </Grid>
                  )}
                </Grid>
              </Card>

              <Card>
                <SectionTitle>Contatos e endereços</SectionTitle>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Typography fontWeight={800} sx={{ mb: 1 }}>Telefones</Typography>
                    {(client.telefones || []).length === 0 && <Typography color="text.secondary">Nenhum telefone</Typography>}
                    {(client.telefones || []).map((item) => (
                      <Typography key={item.id} sx={{ mb: 0.75 }}>
                        {item.numero} · {optionLabel(TIPOS_CONTATO, item.tipo)}{item.principal ? " · principal" : ""}
                      </Typography>
                    ))}
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Typography fontWeight={800} sx={{ mb: 1 }}>E-mails</Typography>
                    {(client.emails || []).length === 0 && <Typography color="text.secondary">Nenhum e-mail</Typography>}
                    {(client.emails || []).map((item) => (
                      <Typography key={item.id} sx={{ mb: 0.75 }}>
                        {item.email} · {optionLabel(TIPOS_CONTATO, item.tipo)}{item.principal ? " · principal" : ""}
                      </Typography>
                    ))}
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Typography fontWeight={800} sx={{ mb: 1 }}>Endereços</Typography>
                    {(client.enderecos || []).length === 0 && <Typography color="text.secondary">Nenhum endereço</Typography>}
                    {(client.enderecos || []).map((item) => (
                      <Typography key={item.id} sx={{ mb: 1 }}>
                        {optionLabel(TIPOS_ENDERECO, item.tipo)} — {item.logradouro}, {item.numero || "s/n"} · {item.cidade}/{item.estado}
                      </Typography>
                    ))}
                  </Grid>
                </Grid>
              </Card>

              {active && (
                <>
                  <Card>
                    <SectionTitle>Anotações</SectionTitle>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ mb: 2 }}>
                      <Input multiline rows={2} label="Nova anotação" value={note} onChange={(event) => setNote(event.target.value)} sx={{ flex: 1 }} />
                      <Button variant="contained" startIcon={<NoteAddOutlined />} loading={busy} onClick={addNote}>Salvar</Button>
                    </Stack>
                    <Stack spacing={1.5}>
                      {(client.anotacoes || []).map((item) => (
                        <Box key={item.id} sx={{ p: 1.5, borderRadius: 2, bgcolor: "action.hover" }}>
                          <Typography sx={{ whiteSpace: "pre-wrap" }}>{item.conteudo}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.usuario?.nome} · {formatDateTime(item.createdAt)}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Card>

                  <Card>
                    <SectionTitle>Timeline de interações</SectionTitle>
                    <Grid container spacing={1.5} sx={{ mb: 2 }}>
                      <Grid size={{ xs: 12, md: 3 }}><Select label="Tipo" value={interaction.tipo} options={TIPOS_INTERACAO} onChange={(event) => setInteraction((current) => ({ ...current, tipo: event.target.value }))} /></Grid>
                      <Grid size={{ xs: 12, md: 5 }}><Input label="Título" value={interaction.titulo} onChange={(event) => setInteraction((current) => ({ ...current, titulo: event.target.value }))} /></Grid>
                      <Grid size={{ xs: 12, md: 4 }}><Select label="Imóvel (opcional)" value={interaction.imovelId} options={imovelOptions} onChange={(event) => setInteraction((current) => ({ ...current, imovelId: event.target.value }))} /></Grid>
                      <Grid size={{ xs: 12 }}><Input multiline rows={2} label="Descrição" value={interaction.descricao} onChange={(event) => setInteraction((current) => ({ ...current, descricao: event.target.value }))} /></Grid>
                      <Grid size={{ xs: 12 }}><Button variant="contained" loading={busy} onClick={addInteraction}>Registrar interação</Button></Grid>
                    </Grid>
                    <Stack spacing={1.5}>
                      {(client.interacoes || []).map((item) => (
                        <Box key={item.id} sx={{ p: 1.5, borderLeft: 3, borderColor: "primary.main", pl: 2 }}>
                          <Typography fontWeight={800}>{item.titulo} · {optionLabel(TIPOS_INTERACAO, item.tipo)}</Typography>
                          {item.descricao && <Typography color="text.secondary">{item.descricao}</Typography>}
                          <Typography variant="caption" color="text.secondary">
                            {item.usuario?.nome} · {formatDateTime(item.dataHora)}
                            {item.imovel ? ` · ${item.imovel.codigo} ${item.imovel.titulo}` : ""}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Card>
                </>
              )}

              <Card>
                <SectionTitle
                  action={active && (
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}>
                      <Select size="small" label="Tipo" value={docTipo} options={TIPOS_DOCUMENTO} onChange={(event) => setDocTipo(event.target.value)} sx={{ minWidth: 180 }} />
                      <Input size="small" label="Nome" value={docNome} onChange={(event) => setDocNome(event.target.value)} sx={{ minWidth: 160 }} />
                      <Button component="label" variant="outlined" startIcon={<UploadFileOutlined />}>
                        Enviar
                        <input hidden type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx" onChange={uploadDocuments} />
                      </Button>
                    </Stack>
                  )}
                >
                  Documentos
                </SectionTitle>
                <Stack spacing={1.25}>
                  {(client.documentos || []).length === 0 && <Typography color="text.secondary">Nenhum documento anexado.</Typography>}
                  {(client.documentos || []).map((doc) => (
                    <Stack key={doc.id} direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 1.25, borderRadius: 2, border: 1, borderColor: "divider" }}>
                      <Box>
                        <Typography fontWeight={750}>{doc.nome}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {optionLabel(TIPOS_DOCUMENTO, doc.tipo)} · {(doc.tamanho / 1024).toFixed(0)} KB · {formatDateTime(doc.createdAt)}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={0.5}>
                        <IconButton component="a" href={`${api.defaults.baseURL}${doc.url}`} target="_blank" rel="noreferrer" onClick={async (event) => {
                          event.preventDefault();
                          try {
                            const response = await api.get(doc.url, { responseType: "blob" });
                            downloadBlob(response.data, doc.nomeArquivo || doc.nome);
                          } catch {
                            toast.error("Erro ao baixar documento.");
                          }
                        }}>
                          <FileDownloadOutlined />
                        </IconButton>
                        {active && (
                          <IconButton color="error" onClick={() => setConfirm({ type: "document", item: doc })}>
                            <DeleteOutlined />
                          </IconButton>
                        )}
                      </Stack>
                    </Stack>
                  ))}
                </Stack>
              </Card>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }}>
            <Stack spacing={2.5}>
              <Card>
                <SectionTitle>Integração com imóveis</SectionTitle>
                {active && (
                  <Stack spacing={1.5} sx={{ mb: 2 }}>
                    <Select label="Favoritar imóvel" value={favoriteImovelId} options={imovelOptions} onChange={(event) => setFavoriteImovelId(event.target.value)} />
                    <Button startIcon={<FavoriteBorder />} variant="outlined" loading={busy} onClick={addFavorite}>Adicionar favorito</Button>
                  </Stack>
                )}
                <Typography fontWeight={800} sx={{ mb: 1 }}>Favoritos</Typography>
                <Stack spacing={1} sx={{ mb: 2.5 }}>
                  {(client.favoritos || []).length === 0 && <Typography color="text.secondary" variant="body2">Nenhum favorito.</Typography>}
                  {(client.favoritos || []).map((item) => (
                    <Stack key={item.id} direction="row" justifyContent="space-between" alignItems="center">
                      <Box sx={{ cursor: "pointer" }} onClick={() => navigate(`/imoveis/${item.imovelId}`)}>
                        <Typography fontWeight={750}>{item.imovel?.codigo} — {item.imovel?.titulo}</Typography>
                        <Typography variant="caption" color="text.secondary">{item.imovel?.cidade}</Typography>
                      </Box>
                      {active && <IconButton size="small" color="error" onClick={() => removeFavorite(item.imovelId)}><DeleteOutlined fontSize="small" /></IconButton>}
                    </Stack>
                  ))}
                </Stack>

                <Divider sx={{ my: 2 }} />
                <Typography fontWeight={800} sx={{ mb: 1 }}>Registrar visita</Typography>
                {active && (
                  <Stack spacing={1.25} sx={{ mb: 2 }}>
                    <Select label="Imóvel" value={visit.imovelId} options={imovelOptions} onChange={(event) => setVisit((current) => ({ ...current, imovelId: event.target.value }))} />
                    <Input type="datetime-local" label="Data/hora" slotProps={{ inputLabel: { shrink: true } }} value={visit.dataHora} onChange={(event) => setVisit((current) => ({ ...current, dataHora: event.target.value }))} />
                    <Select label="Status" value={visit.status} options={STATUS_VISITA} onChange={(event) => setVisit((current) => ({ ...current, status: event.target.value }))} />
                    <Input label="Observações" value={visit.observacoes} onChange={(event) => setVisit((current) => ({ ...current, observacoes: event.target.value }))} />
                    <Button variant="contained" loading={busy} onClick={addVisit}>Salvar visita</Button>
                  </Stack>
                )}
                <Stack spacing={1} sx={{ mb: 2.5 }}>
                  {(client.visitas || []).map((item) => (
                    <Box key={item.id}>
                      <Typography fontWeight={750}>{item.imovel?.codigo} — {item.imovel?.titulo}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {optionLabel(STATUS_VISITA, item.status)} · {formatDateTime(item.dataHora)}
                      </Typography>
                    </Box>
                  ))}
                </Stack>

                <Divider sx={{ my: 2 }} />
                <Typography fontWeight={800} sx={{ mb: 1 }}>Registrar proposta</Typography>
                {active && (
                  <Stack spacing={1.25} sx={{ mb: 2 }}>
                    <Select label="Imóvel" value={proposal.imovelId} options={imovelOptions} onChange={(event) => setProposal((current) => ({ ...current, imovelId: event.target.value }))} />
                    <Input type="number" label="Valor" value={proposal.valor} onChange={(event) => setProposal((current) => ({ ...current, valor: event.target.value }))} />
                    <Select label="Status" value={proposal.status} options={STATUS_PROPOSTA} onChange={(event) => setProposal((current) => ({ ...current, status: event.target.value }))} />
                    <Input label="Observações" value={proposal.observacoes} onChange={(event) => setProposal((current) => ({ ...current, observacoes: event.target.value }))} />
                    <Button variant="contained" loading={busy} onClick={addProposal}>Salvar proposta</Button>
                  </Stack>
                )}
                <Stack spacing={1}>
                  {(client.propostas || []).map((item) => (
                    <Box key={item.id}>
                      <Typography fontWeight={750}>{item.imovel?.codigo} — {formatCurrency(item.valor)}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {optionLabel(STATUS_PROPOSTA, item.status)} · {formatDateTime(item.createdAt)}
                      </Typography>
                    </Box>
                  ))}
                </Stack>

                {(client.imoveisProprietario || []).length > 0 && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography fontWeight={800} sx={{ mb: 1 }}>Imóveis como proprietário</Typography>
                    {(client.imoveisProprietario || []).map((item) => (
                      <Typography key={item.id} sx={{ cursor: "pointer", mb: 0.75 }} onClick={() => navigate(`/imoveis/${item.id}`)}>
                        {item.codigo} — {item.titulo}
                      </Typography>
                    ))}
                  </>
                )}
              </Card>

              <Card>
                <SectionTitle>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <HistoryOutlined fontSize="small" />
                    <span>Histórico</span>
                  </Stack>
                </SectionTitle>
                <Stack spacing={1.5}>
                  {history.map((item) => (
                    <Box key={item.id}>
                      <Typography fontWeight={750}>{HISTORY_LABELS[item.acao] || item.acao}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.usuario?.nome} · {formatDateTime(item.createdAt)}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
                {historyMeta.totalPages > 1 && (
                  <Stack alignItems="center" sx={{ mt: 2 }}>
                    <Pagination page={historyPage} count={historyMeta.totalPages} size="small" onChange={(event, value) => setHistoryPage(value)} />
                  </Stack>
                )}
              </Card>
            </Stack>
          </Grid>
        </Grid>
      </Stack>

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={executeConfirm}
        loading={busy}
        title={confirm?.type === "restore" ? "Reativar cliente" : confirm?.type === "document" ? "Remover documento" : "Desativar cliente"}
        description={
          confirm?.type === "restore"
            ? `O cliente “${client.nome}” voltará à carteira ativa.`
            : confirm?.type === "document"
              ? `Remover “${confirm.item?.nome}”?`
              : `O cliente “${client.nome}” será desativado (soft delete).`
        }
        confirmLabel={confirm?.type === "restore" ? "Reativar" : confirm?.type === "document" ? "Remover" : "Desativar"}
      />
    </MainLayout>
  );
}
