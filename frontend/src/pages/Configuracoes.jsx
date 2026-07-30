import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  MenuItem,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { PersonAdd, Save } from "@mui/icons-material";
import MainLayout from "../components/layout/MainLayout";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import Loading from "../components/ui/Loading";
import { useToast } from "../components/ui/Toast";
import AuthenticatedImage from "../components/imoveis/AuthenticatedImage";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const PLANOS = {
  STARTER: { label: "Starter", cor: "#64748b", limite: "Até 50 imóveis" },
  PROFESSIONAL: { label: "Professional", cor: "#3b82f6", limite: "Até 500 imóveis" },
  ENTERPRISE: { label: "Enterprise", cor: "#8b5cf6", limite: "Ilimitado" },
};

const emptyEmpresa = {
  nome: "",
  nomeFantasia: "",
  cnpj: "",
  creci: "",
  slogan: "",
  email: "",
  telefone: "",
  whatsapp: "",
  siteUrl: "",
  corPrimaria: "#0B1F3A",
  corSecundaria: "#C9A227",
  endereco: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
  cep: "",
  instagram: "",
  facebook: "",
  linkedin: "",
  youtube: "",
  horarioAtendimento: "",
  googleMapsUrl: "",
  latitude: "",
  longitude: "",
  siteTitulo: "",
  siteDescricao: "",
  seoKeywords: "",
  siteAtivo: true,
  siteExibirCorretores: true,
  siteExibirBlog: true,
  logoUrl: null,
  faviconUrl: null,
  plano: "STARTER",
};

function Field(props) {
  return <TextField fullWidth size="small" {...props} />;
}

export default function Configuracoes() {
  const { usuario } = useAuth();
  const toast = useToast();
  const isAdmin = usuario?.tipo === "ADMIN";

  const [empresa, setEmpresa] = useState(emptyEmpresa);
  const [loadingEmpresa, setLoadingEmpresa] = useState(true);
  const [savingEmpresa, setSavingEmpresa] = useState(false);

  const [usuarios, setUsuarios] = useState([]);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [savingUser, setSavingUser] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nome: "", email: "", senha: "", tipo: "CORRETOR", telefone: "" });
  const [erro, setErro] = useState("");

  const carregarEmpresa = useCallback(async () => {
    setLoadingEmpresa(true);
    try {
      const res = await api.get("/empresa");
      setEmpresa({
        ...emptyEmpresa,
        ...res.data,
        latitude: res.data.latitude ?? "",
        longitude: res.data.longitude ?? "",
      });
    } catch (error) {
      toast.error(error.response?.data?.erro || "Erro ao carregar empresa.");
    } finally {
      setLoadingEmpresa(false);
    }
  }, [toast]);

  const carregarEquipe = useCallback(async () => {
    if (!isAdmin && usuario?.tipo !== "GERENTE") return;
    setLoadingTeam(true);
    try {
      const res = await api.get("/auth/usuarios");
      setUsuarios(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      toast.error(error.response?.data?.erro || "Erro ao carregar equipe.");
    } finally {
      setLoadingTeam(false);
    }
  }, [isAdmin, usuario?.tipo, toast]);

  useEffect(() => {
    carregarEmpresa();
    carregarEquipe();
  }, [carregarEmpresa, carregarEquipe]);

  const update = (key, value) => setEmpresa((current) => ({ ...current, [key]: value }));

  const salvarEmpresa = async () => {
    if (!isAdmin) return;
    setSavingEmpresa(true);
    try {
      const payload = {
        ...empresa,
        latitude: empresa.latitude === "" ? null : Number(empresa.latitude),
        longitude: empresa.longitude === "" ? null : Number(empresa.longitude),
      };
      delete payload.logoUrl;
      delete payload.faviconUrl;
      delete payload.plano;
      delete payload.id;
      delete payload.ativo;
      delete payload.updatedAt;
      const res = await api.put("/empresa", payload);
      setEmpresa((current) => ({ ...current, ...res.data }));
      toast.success("Dados da empresa salvos. Site e CRM usarão estas informações.");
      const saved = localStorage.getItem("usuario");
      if (saved) {
        const u = JSON.parse(saved);
        u.empresaNome = res.data.nomeFantasia || res.data.nome;
        localStorage.setItem("usuario", JSON.stringify(u));
      }
    } catch (error) {
      toast.error(error.response?.data?.erro || "Erro ao salvar empresa.");
    } finally {
      setSavingEmpresa(false);
    }
  };

  const uploadAsset = async (kind, file) => {
    if (!file) return;
    const body = new FormData();
    body.append(kind, file);
    try {
      const res = await api.post(`/empresa/${kind}`, body, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setEmpresa((current) => ({ ...current, ...res.data }));
      toast.success(kind === "logo" ? "Logo atualizada." : "Favicon atualizado.");
    } catch (error) {
      toast.error(error.response?.data?.erro || "Falha no upload.");
    }
  };

  const criarUsuario = async () => {
    setErro("");
    if (!form.nome.trim() || !form.email.trim() || !form.senha) {
      setErro("Preencha nome, e-mail e senha.");
      return;
    }
    if (form.senha.length < 8) {
      setErro("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    setSavingUser(true);
    try {
      await api.post("/auth/usuarios", form);
      setOpen(false);
      setForm({ nome: "", email: "", senha: "", tipo: "CORRETOR", telefone: "" });
      toast.success("Usuário criado com sucesso.");
      await carregarEquipe();
    } catch (err) {
      setErro(err.response?.data?.erro || "Erro ao criar usuário");
    } finally {
      setSavingUser(false);
    }
  };

  const plano = PLANOS[empresa.plano] || PLANOS[usuario?.plano] || PLANOS.STARTER;

  return (
    <MainLayout title="Configurações">
      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <Card>
            <StackHeader
              title="Configurações da Empresa"
              subtitle="Dados oficiais da Top Conceição — alimentam CRM, site, rodapé, contato e SEO."
              action={isAdmin && (
                <Button variant="contained" startIcon={<Save />} loading={savingEmpresa} onClick={salvarEmpresa}>
                  Salvar empresa
                </Button>
              )}
            />
            {!isAdmin && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Somente administradores podem editar os dados da empresa. Você pode visualizar o perfil atual.
              </Alert>
            )}
            {loadingEmpresa ? (
              <Loading variant="skeleton" rows={8} />
            ) : (
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Field label="Nome da empresa *" value={empresa.nome} onChange={(e) => update("nome", e.target.value)} disabled={!isAdmin} />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Field label="Nome fantasia" value={empresa.nomeFantasia || ""} onChange={(e) => update("nomeFantasia", e.target.value)} disabled={!isAdmin} />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Field label="CNPJ" value={empresa.cnpj || ""} onChange={(e) => update("cnpj", e.target.value)} disabled={!isAdmin} />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Field label="CRECI" value={empresa.creci || ""} onChange={(e) => update("creci", e.target.value)} disabled={!isAdmin} />
                </Grid>
                <Grid size={{ xs: 12, md: 8 }}>
                  <Field label="Slogan" value={empresa.slogan || ""} onChange={(e) => update("slogan", e.target.value)} disabled={!isAdmin} />
                </Grid>

                <Grid size={{ xs: 12 }}><Divider sx={{ my: 1 }} /><Typography variant="subtitle2" color="primary">Marca</Typography></Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Field label="Cor primária" value={empresa.corPrimaria || "#0B1F3A"} onChange={(e) => update("corPrimaria", e.target.value)} disabled={!isAdmin} />
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Field label="Cor secundária" value={empresa.corSecundaria || "#C9A227"} onChange={(e) => update("corSecundaria", e.target.value)} disabled={!isAdmin} />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <Typography variant="caption" color="text.secondary">Logo</Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 0.5 }}>
                    <Box sx={{ width: 56, height: 56, borderRadius: 2, overflow: "hidden", bgcolor: "action.hover", border: "1px solid", borderColor: "divider" }}>
                      {empresa.logoUrl ? (
                        <AuthenticatedImage src="/empresa/logo/arquivo" alt="Logo" sx={{ width: 56, height: 56 }} />
                      ) : (
                        <Box sx={{ width: 56, height: 56, bgcolor: empresa.corPrimaria || "#0B1F3A" }} />
                      )}
                    </Box>
                    {isAdmin && (
                      <Button component="label" variant="outlined" size="small">
                        Enviar
                        <input hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => uploadAsset("logo", e.target.files?.[0])} />
                      </Button>
                    )}
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <Typography variant="caption" color="text.secondary">Favicon</Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 0.5 }}>
                    <Box sx={{ width: 40, height: 40, borderRadius: 1, overflow: "hidden", bgcolor: "action.hover", border: "1px solid", borderColor: "divider" }}>
                      {empresa.faviconUrl ? (
                        <AuthenticatedImage src="/empresa/favicon/arquivo" alt="Favicon" sx={{ width: 40, height: 40 }} />
                      ) : null}
                    </Box>
                    {isAdmin && (
                      <Button component="label" variant="outlined" size="small">
                        Enviar
                        <input hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => uploadAsset("favicon", e.target.files?.[0])} />
                      </Button>
                    )}
                  </Box>
                </Grid>

                <Grid size={{ xs: 12 }}><Divider sx={{ my: 1 }} /><Typography variant="subtitle2" color="primary">Contato</Typography></Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Field label="Telefone" value={empresa.telefone || ""} onChange={(e) => update("telefone", e.target.value)} disabled={!isAdmin} />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Field label="WhatsApp (somente dígitos)" value={empresa.whatsapp || ""} onChange={(e) => update("whatsapp", e.target.value)} disabled={!isAdmin} helperText="Ex.: 5511999999999" />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Field label="E-mail" type="email" value={empresa.email || ""} onChange={(e) => update("email", e.target.value)} disabled={!isAdmin} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Field label="Site" value={empresa.siteUrl || ""} onChange={(e) => update("siteUrl", e.target.value)} disabled={!isAdmin} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Field label="Horário de atendimento" value={empresa.horarioAtendimento || ""} onChange={(e) => update("horarioAtendimento", e.target.value)} disabled={!isAdmin} />
                </Grid>

                <Grid size={{ xs: 12 }}><Divider sx={{ my: 1 }} /><Typography variant="subtitle2" color="primary">Endereço</Typography></Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Field label="Endereço" value={empresa.endereco || ""} onChange={(e) => update("endereco", e.target.value)} disabled={!isAdmin} />
                </Grid>
                <Grid size={{ xs: 6, md: 2 }}>
                  <Field label="Número" value={empresa.numero || ""} onChange={(e) => update("numero", e.target.value)} disabled={!isAdmin} />
                </Grid>
                <Grid size={{ xs: 6, md: 4 }}>
                  <Field label="Complemento" value={empresa.complemento || ""} onChange={(e) => update("complemento", e.target.value)} disabled={!isAdmin} />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Field label="Bairro" value={empresa.bairro || ""} onChange={(e) => update("bairro", e.target.value)} disabled={!isAdmin} />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Field label="Cidade" value={empresa.cidade || ""} onChange={(e) => update("cidade", e.target.value)} disabled={!isAdmin} />
                </Grid>
                <Grid size={{ xs: 6, md: 2 }}>
                  <Field label="UF" value={empresa.estado || ""} onChange={(e) => update("estado", e.target.value)} disabled={!isAdmin} />
                </Grid>
                <Grid size={{ xs: 6, md: 2 }}>
                  <Field label="CEP" value={empresa.cep || ""} onChange={(e) => update("cep", e.target.value)} disabled={!isAdmin} />
                </Grid>

                <Grid size={{ xs: 12 }}><Divider sx={{ my: 1 }} /><Typography variant="subtitle2" color="primary">Redes sociais</Typography></Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Field label="Instagram" value={empresa.instagram || ""} onChange={(e) => update("instagram", e.target.value)} disabled={!isAdmin} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Field label="Facebook" value={empresa.facebook || ""} onChange={(e) => update("facebook", e.target.value)} disabled={!isAdmin} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Field label="LinkedIn" value={empresa.linkedin || ""} onChange={(e) => update("linkedin", e.target.value)} disabled={!isAdmin} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Field label="YouTube" value={empresa.youtube || ""} onChange={(e) => update("youtube", e.target.value)} disabled={!isAdmin} />
                </Grid>

                <Grid size={{ xs: 12 }}><Divider sx={{ my: 1 }} /><Typography variant="subtitle2" color="primary">Google Maps</Typography></Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Field label="URL do Google Maps" value={empresa.googleMapsUrl || ""} onChange={(e) => update("googleMapsUrl", e.target.value)} disabled={!isAdmin} />
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Field label="Latitude" value={empresa.latitude} onChange={(e) => update("latitude", e.target.value)} disabled={!isAdmin} />
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Field label="Longitude" value={empresa.longitude} onChange={(e) => update("longitude", e.target.value)} disabled={!isAdmin} />
                </Grid>

                <Grid size={{ xs: 12 }}><Divider sx={{ my: 1 }} /><Typography variant="subtitle2" color="primary">Site e SEO</Typography></Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Field label="Título SEO / site" value={empresa.siteTitulo || ""} onChange={(e) => update("siteTitulo", e.target.value)} disabled={!isAdmin} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Field label="Keywords (separadas por vírgula)" value={empresa.seoKeywords || ""} onChange={(e) => update("seoKeywords", e.target.value)} disabled={!isAdmin} />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Field label="Descrição SEO" multiline rows={2} value={empresa.siteDescricao || ""} onChange={(e) => update("siteDescricao", e.target.value)} disabled={!isAdmin} />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <FormControlLabel control={<Switch checked={Boolean(empresa.siteAtivo)} onChange={(e) => update("siteAtivo", e.target.checked)} disabled={!isAdmin} />} label="Site ativo" />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <FormControlLabel control={<Switch checked={Boolean(empresa.siteExibirCorretores)} onChange={(e) => update("siteExibirCorretores", e.target.checked)} disabled={!isAdmin} />} label="Exibir corretores" />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <FormControlLabel control={<Switch checked={Boolean(empresa.siteExibirBlog)} onChange={(e) => update("siteExibirBlog", e.target.checked)} disabled={!isAdmin} />} label="Exibir blog" />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Chip label={`Plano ${plano.label}`} sx={{ bgcolor: plano.cor, color: "#fff", fontWeight: 600 }} />
                  <Typography variant="caption" display="block" sx={{ mt: 1 }} color="text.secondary">{plano.limite}</Typography>
                </Grid>
              </Grid>
            )}
          </Card>
        </Grid>

        {(isAdmin || usuario?.tipo === "GERENTE") && (
          <Grid size={{ xs: 12 }}>
            <Card>
              <StackHeader
                title="Equipe"
                subtitle="Usuários com acesso ao CRM"
                action={isAdmin && (
                  <Button variant="contained" startIcon={<PersonAdd />} onClick={() => setOpen(true)}>
                    Adicionar Usuário
                  </Button>
                )}
              />
              {loadingTeam ? (
                <Loading variant="skeleton" rows={4} />
              ) : usuarios.length === 0 ? (
                <EmptyState title="Nenhum usuário na equipe" description="Adicione corretores e gestores." actionLabel={isAdmin ? "Adicionar usuário" : undefined} onAction={isAdmin ? () => setOpen(true) : undefined} />
              ) : (
                <Box sx={{ overflowX: "auto" }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Nome</TableCell>
                        <TableCell>E-mail</TableCell>
                        <TableCell>Tipo</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {usuarios.map((u) => (
                        <TableRow key={u.id} hover>
                          <TableCell>{u.nome}</TableCell>
                          <TableCell>{u.email}</TableCell>
                          <TableCell><Chip label={u.tipo} size="small" /></TableCell>
                          <TableCell>
                            <Chip label={u.ativo ? "Ativo" : "Inativo"} color={u.ativo ? "success" : "default"} size="small" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              )}
            </Card>
          </Grid>
        )}
      </Grid>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Novo Usuário</DialogTitle>
        <DialogContent>
          {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth required label="Nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth required label="E-mail" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth required label="Senha" type="password" helperText="Mínimo de 8 caracteres" value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth select label="Tipo" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                <MenuItem value="CORRETOR">Corretor</MenuItem>
                <MenuItem value="GERENTE">Gerente</MenuItem>
                <MenuItem value="ADMIN">Administrador</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Telefone" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" loading={savingUser} onClick={criarUsuario}>Criar</Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
}

function StackHeader({ title, subtitle, action }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap", mb: 2.5 }}>
      <Box>
        <Typography variant="h6">{title}</Typography>
        {subtitle && <Typography variant="body2" color="text.secondary">{subtitle}</Typography>}
      </Box>
      {action}
    </Box>
  );
}
