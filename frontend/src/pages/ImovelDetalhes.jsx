import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Chip,
  Divider,
  Grid,
  Link,
  Pagination,
  Stack,
  Typography,
} from "@mui/material";
import {
  ArrowBack,
  BathtubOutlined,
  BedOutlined,
  DeleteOutlined,
  DirectionsCarOutlined,
  EditOutlined,
  EmailOutlined,
  HistoryOutlined,
  LocationOnOutlined,
  PersonOutlined,
  PhoneOutlined,
  RestartAltOutlined,
  SquareFootOutlined,
  VpnKeyOutlined,
  WhatsApp,
} from "@mui/icons-material";
import MainLayout from "../components/layout/MainLayout";
import PropertyImages from "../components/property/PropertyImages";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Loading from "../components/ui/Loading";
import { useToast } from "../components/ui/Toast";
import api from "../api/axios";
import { formatCurrency, formatDate, formatDateTime } from "../utils/formatters";
import {
  CARACTERISTICAS_IMOVEL,
  FINALIDADES_IMOVEL,
  OCUPACOES_IMOVEL,
  ORIGENS_CAPTACAO,
  SITUACOES_CAPTACAO,
  TIPOS_IMOVEL,
  describeHistoryEntry,
  optionLabel,
  whatsappLink,
} from "../utils/imoveis";

function InfoItem({ icon: Icon, label, value }) {
  return (
    <Stack direction="row" spacing={1.25} alignItems="center">
      <Box sx={{ width: 38, height: 38, borderRadius: 2, bgcolor: "action.hover", color: "primary.main", display: "grid", placeItems: "center" }}>
        <Icon fontSize="small" />
      </Box>
      <Box>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
        <Typography fontWeight={750}>{value ?? "—"}</Typography>
      </Box>
    </Stack>
  );
}

function ContactLine({ icon: Icon, label, value, href }) {
  if (!value) {
    return (
      <Stack direction="row" spacing={1} alignItems="center">
        <Icon fontSize="small" color="disabled" />
        <Typography variant="body2" color="text.secondary">{label}: —</Typography>
      </Stack>
    );
  }
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Icon fontSize="small" color="primary" />
      <Typography variant="body2">
        {label}:{" "}
        {href ? (
          <Link href={href} target="_blank" rel="noopener noreferrer" underline="hover">{value}</Link>
        ) : value}
      </Typography>
    </Stack>
  );
}

export default function ImovelDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [property, setProperty] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyMeta, setHistoryMeta] = useState({ page: 1, totalPages: 1 });
  const [historyPage, setHistoryPage] = useState(1);
  const [chaveHistorico, setChaveHistorico] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(null);
  const [confirming, setConfirming] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await api.get(`/properties/${id}`);
      setProperty(response.data);
      setChaveHistorico(response.data.chaveHistorico || []);
    } catch (error) {
      toast.error(error.response?.data?.message || error.response?.data?.erro || "Erro ao carregar imóvel.");
      navigate("/imoveis");
    } finally {
      setLoading(false);
    }
  }, [id, navigate, toast]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setHistory([]);
    setHistoryMeta({ page: 1, totalPages: 1 });
  }, [historyPage]);

  const executeConfirmation = async () => {
    if (confirm?.type !== "property") return;
    setConfirming(true);
    try {
      await api.delete(`/properties/${id}`);
      toast.success("Imóvel desativado.");
      navigate("/imoveis");
      setConfirm(null);
    } catch (error) {
      toast.error(error.response?.data?.message || error.response?.data?.erro || "Não foi possível concluir a ação.");
    } finally {
      setConfirming(false);
    }
  };

  if (loading || !property) return <MainLayout title="Imóvel"><Loading variant="skeleton" rows={8} /></MainLayout>;

  const address = [
    property.endereco,
    property.numero,
    property.complemento,
    property.bairro,
    property.cidade,
    property.estado,
  ].filter(Boolean).join(", ");
  const mainValue = property.finalidade === "LOCACAO"
    ? property.valorLocacao
    : property.valorVenda;
  const inactive = !property.ativo;
  const owner = property.proprietario;
  const ownerWhatsapp = whatsappLink(owner?.whatsapp || owner?.celular || owner?.telefone);

  return (
    <MainLayout title="Detalhes do imóvel">
      <Stack spacing={3}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={2}>
          <Box>
            <Button color="inherit" startIcon={<ArrowBack />} onClick={() => navigate("/imoveis")}>Voltar ao portfólio</Button>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5, mb: 0.5 }} flexWrap="wrap" useFlexGap>
              <Chip size="small" label={property.codigo} />
              <Chip size="small" color={property.publicado ? "success" : "default"} label={property.publicado ? "Publicado" : "Não publicado"} />
              {inactive && <Chip size="small" color="error" label="Desativado" />}
              {property.publicado && <Chip size="small" color="success" label="No site" />}
              {property.oculto && <Chip size="small" label="Oculto" />}
              {property.emRevisao && <Chip size="small" color="warning" label="Em revisão" />}
            </Stack>
            <Typography variant="h4" fontWeight={900}>{property.titulo}</Typography>
            <Stack direction="row" spacing={0.75} alignItems="center" color="text.secondary">
              <LocationOnOutlined fontSize="small" />
              <Typography>{property.bairro}, {property.cidade} — {property.estado}</Typography>
            </Stack>
          </Box>
          <Stack direction="row" spacing={1.5} alignItems="flex-start">
            {!inactive && (
              <>
                <Button variant="outlined" startIcon={<EditOutlined />} onClick={() => navigate(`/imoveis/${id}/editar`)}>Editar</Button>
                <Button color="error" variant="outlined" startIcon={<DeleteOutlined />} onClick={() => setConfirm({ type: "property", item: property })}>Desativar</Button>
              </>
            )}
            {inactive && (
              <Button variant="contained" startIcon={<RestartAltOutlined />} disabled title="Reativação temporariamente indisponível no backend">Reativar imóvel</Button>
            )}
          </Stack>
        </Stack>

        <PropertyImages
          propertyId={id}
          title={property.titulo}
          readOnly={inactive}
        />

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Stack spacing={3}>
              <Card>
                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={2}>
                  <Box>
                    <Typography variant="overline" color="primary.main" fontWeight={850}>
                      {optionLabel(TIPOS_IMOVEL, property.tipo)} • {optionLabel(FINALIDADES_IMOVEL, property.finalidade)}
                    </Typography>
                    <Typography variant="h4" color="primary.main" fontWeight={900}>{formatCurrency(mainValue)}</Typography>
                    {property.finalidade === "LOCACAO" && <Typography color="text.secondary">por mês</Typography>}
                  </Box>
                  <Grid container spacing={2.5} sx={{ minWidth: { sm: 400 } }}>
                    <Grid size={6}><InfoItem icon={BedOutlined} label="Quartos" value={property.quartos} /></Grid>
                    <Grid size={6}><InfoItem icon={BathtubOutlined} label="Banheiros" value={property.banheiros} /></Grid>
                    <Grid size={6}><InfoItem icon={DirectionsCarOutlined} label="Vagas" value={property.vagas} /></Grid>
                    <Grid size={6}><InfoItem icon={SquareFootOutlined} label="Área construída" value={property.areaConstruida ? `${property.areaConstruida} m²` : "—"} /></Grid>
                  </Grid>
                </Stack>
                <Divider sx={{ my: 3 }} />
                <Typography variant="h6" fontWeight={800} gutterBottom>Descrição</Typography>
                <Typography color="text.secondary" sx={{ whiteSpace: "pre-line" }}>{property.descricao || "Nenhuma descrição informada."}</Typography>
              </Card>

              <Card>
                <Typography variant="h6" fontWeight={800} gutterBottom>Endereço e dimensões</Typography>
                <Typography color="text.secondary" sx={{ mb: 3 }}>{address}</Typography>
                <Grid container spacing={2.5}>
                  <Grid size={{ xs: 6, md: 3 }}><InfoItem icon={SquareFootOutlined} label="Área útil" value={property.areaUtil ? `${property.areaUtil} m²` : "—"} /></Grid>
                  <Grid size={{ xs: 6, md: 3 }}><InfoItem icon={SquareFootOutlined} label="Área construída" value={property.areaConstruida ? `${property.areaConstruida} m²` : "—"} /></Grid>
                  <Grid size={{ xs: 6, md: 3 }}><InfoItem icon={SquareFootOutlined} label="Terreno" value={property.areaTerreno ? `${property.areaTerreno} m²` : "—"} /></Grid>
                  <Grid size={{ xs: 6, md: 3 }}><InfoItem icon={BedOutlined} label="Suítes" value={property.suites} /></Grid>
                </Grid>
              </Card>

              <Card>
                <Typography variant="h6" fontWeight={800} gutterBottom>Características e publicação</Typography>
                <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
                  {property.exclusividade && <Chip label="Exclusividade" color="primary" />}
                  {property.aceitaFinanciamento && <Chip label="Aceita financiamento" variant="outlined" />}
                  {property.aceitaFgts && <Chip label="Aceita FGTS" variant="outlined" />}
                  {property.aceitaPermuta && <Chip label="Aceita permuta" variant="outlined" />}
                  {property.aceitaVeiculo && <Chip label="Aceita veículo" variant="outlined" />}
                  {property.estudaProposta && <Chip label="Estuda proposta" variant="outlined" />}
                  {property.ocupacao && <Chip label={`Ocupação: ${optionLabel(OCUPACOES_IMOVEL, property.ocupacao)}`} variant="outlined" />}
                  {property.destaqueSite && <Chip label="Destaque Home" color="secondary" variant="outlined" />}
                  {property.altoPadrao && <Chip label="Alto Padrão" variant="outlined" />}
                  {property.publicacaoComercial && <Chip label="Comercial" variant="outlined" />}
                  {property.lancamento && <Chip label="Lançamento" variant="outlined" />}
                </Stack>
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  {(property.caracteristicas?.length
                    ? property.caracteristicas
                    : [
                      ...(property.piscina ? ["PISCINA"] : []),
                      ...(property.churrasqueira ? ["CHURRASQUEIRA"] : []),
                    ]
                  ).map((feature) => (
                    <Chip key={feature} label={optionLabel(CARACTERISTICAS_IMOVEL, feature)} variant="outlined" />
                  ))}
                  {!property.piscina && !property.churrasqueira && (!property.caracteristicas || property.caracteristicas.length === 0) && (
                    <Typography color="text.secondary">Nenhuma característica informada.</Typography>
                  )}
                </Stack>
              </Card>

              <Card>
                <Typography variant="h6" fontWeight={800} gutterBottom>Controle de chaves</Typography>
                <Typography variant="caption" color="warning.main" display="block" sx={{ mb: 2 }}>
                  Gerenciamento temporariamente desabilitado: o backend atual não expõe controle de chaves.
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}><InfoItem icon={VpnKeyOutlined} label="Local das chaves" value={property.localChaves || "—"} /></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><InfoItem icon={VpnKeyOutlined} label="Código da chave" value={property.codigoChave || "—"} /></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><InfoItem icon={VpnKeyOutlined} label="Status" value={property.chaveRetirada ? "Retirada" : "Na imobiliária"} /></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><InfoItem icon={PersonOutlined} label="Último responsável" value={property.chaveRetiradaPor || "—"} /></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><InfoItem icon={VpnKeyOutlined} label="Data retirada" value={property.chaveRetiradaEm ? formatDateTime(property.chaveRetiradaEm) : "—"} /></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><InfoItem icon={VpnKeyOutlined} label="Data devolução" value={property.chaveDevolvidaEm ? formatDateTime(property.chaveDevolvidaEm) : "—"} /></Grid>
                </Grid>
                {property.chaveObservacoes && (
                  <Typography color="text.secondary" sx={{ mt: 2, whiteSpace: "pre-line" }}>{property.chaveObservacoes}</Typography>
                )}
                <Divider sx={{ my: 2.5 }} />
                <Typography variant="subtitle1" fontWeight={800} gutterBottom>Histórico de chaves</Typography>
                <Stack spacing={1.75}>
                  {chaveHistorico.map((item) => (
                    <Box key={item.id} sx={{ pl: 2, borderLeft: 2, borderColor: item.acao === "RETIRADA" ? "warning.main" : "success.main" }}>
                      <Typography fontWeight={750}>
                        {item.acao === "RETIRADA" ? "Retirada" : "Devolução"}
                        {(item.retiradoPor || item.devolvidoPor) ? ` — ${item.retiradoPor || item.devolvidoPor}` : ""}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.usuario?.nome} • {formatDateTime(item.ocorridoEm)}
                      </Typography>
                      {item.observacao && (
                        <Typography variant="caption" color="text.secondary" display="block">{item.observacao}</Typography>
                      )}
                    </Box>
                  ))}
                  {chaveHistorico.length === 0 && (
                    <Typography color="text.secondary">Nenhuma movimentação registrada. Alterações de retirada/devolução são gravadas automaticamente.</Typography>
                  )}
                </Stack>
              </Card>

              {property.observacoesInternas && (
                <Card>
                  <Typography variant="h6" fontWeight={800} gutterBottom>Observações internas</Typography>
                  <Typography color="text.secondary" sx={{ whiteSpace: "pre-line" }}>{property.observacoesInternas}</Typography>
                </Card>
              )}

              {(property.contratos || []).length > 0 && (
                <Card>
                  <Typography variant="h6" fontWeight={800} gutterBottom>Contratos vinculados</Typography>
                  <Stack divider={<Divider flexItem />}>
                    {property.contratos.map((contract) => (
                      <Stack key={contract.id} direction="row" justifyContent="space-between" sx={{ py: 1.5 }}>
                        <Box><Typography fontWeight={750}>{contract.numero}</Typography><Typography variant="body2" color="text.secondary">{contract.cliente?.nome}</Typography></Box>
                        <Box textAlign="right"><Chip size="small" label={contract.status} /><Typography variant="body2" sx={{ mt: 0.5 }}>{formatCurrency(contract.valor)}</Typography></Box>
                      </Stack>
                    ))}
                  </Stack>
                </Card>
              )}
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }}>
            <Stack spacing={3}>
              <Card>
                <Typography variant="h6" fontWeight={800} gutterBottom>Proprietário</Typography>
                {owner ? (
                  <Stack spacing={1.5}>
                    <InfoItem icon={PersonOutlined} label="Nome" value={owner.nome} />
                    <ContactLine icon={WhatsApp} label="WhatsApp" value={owner.whatsapp || owner.celular || owner.telefone} href={ownerWhatsapp} />
                    <ContactLine icon={PhoneOutlined} label="Telefone" value={owner.celular || owner.telefone} href={(owner.celular || owner.telefone) ? `tel:${owner.celular || owner.telefone}` : null} />
                    <ContactLine icon={EmailOutlined} label="E-mail" value={owner.email} href={owner.email ? `mailto:${owner.email}` : null} />
                  </Stack>
                ) : (
                  <Typography color="text.secondary">Nenhum proprietário vinculado.</Typography>
                )}
                <Divider sx={{ my: 2.5 }} />
                <Typography variant="subtitle2" fontWeight={800} gutterBottom>Responsáveis</Typography>
                <Stack spacing={1.5}>
                  <InfoItem icon={PersonOutlined} label="Corretor responsável" value={property.corretor?.nome || "Não vinculado"} />
                  <InfoItem icon={PersonOutlined} label="Corretor captador" value={property.angariador?.nome || "Não informado"} />
                </Stack>
                <Divider sx={{ my: 2.5 }} />
                <Stack direction="row" justifyContent="space-between"><Typography color="text.secondary">Condomínio</Typography><Typography fontWeight={750}>{formatCurrency(property.condominio)}</Typography></Stack>
                <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}><Typography color="text.secondary">IPTU</Typography><Typography fontWeight={750}>{formatCurrency(property.iptu)}</Typography></Stack>
              </Card>

              <Card>
                <Typography variant="h6" fontWeight={800} gutterBottom>Captação</Typography>
                <Typography variant="caption" color="warning.main" display="block" sx={{ mb: 2 }}>
                  Captação temporariamente desabilitada no backend atual.
                </Typography>
                <Stack spacing={1.25}>
                  <Stack direction="row" justifyContent="space-between"><Typography color="text.secondary">Data</Typography><Typography fontWeight={700}>{property.dataCaptacao ? formatDate(property.dataCaptacao) : "—"}</Typography></Stack>
                  <Stack direction="row" justifyContent="space-between"><Typography color="text.secondary">Origem</Typography><Typography fontWeight={700}>{optionLabel(ORIGENS_CAPTACAO, property.origemCaptacao)}</Typography></Stack>
                  <Stack direction="row" justifyContent="space-between"><Typography color="text.secondary">Situação</Typography><Typography fontWeight={700}>{optionLabel(SITUACOES_CAPTACAO, property.situacaoCaptacao)}</Typography></Stack>
                  <Stack direction="row" justifyContent="space-between"><Typography color="text.secondary">Próx. contato</Typography><Typography fontWeight={700}>{property.proximoContatoProprietario ? formatDate(property.proximoContatoProprietario) : "—"}</Typography></Stack>
                  <Stack direction="row" justifyContent="space-between"><Typography color="text.secondary">Última atualização</Typography><Typography fontWeight={700}>{formatDateTime(property.updatedAt)}</Typography></Stack>
                </Stack>
              </Card>

              <Card>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <HistoryOutlined color="primary" />
                  <Typography variant="h6" fontWeight={800}>Timeline</Typography>
                </Stack>
                <Typography variant="caption" color="warning.main" display="block" sx={{ mb: 2 }}>
                  Histórico temporariamente desabilitado no backend atual.
                </Typography>
                <Stack spacing={2.25}>
                  {history.map((entry) => (
                    <Box key={entry.id} sx={{ pl: 2, borderLeft: 2, borderColor: "primary.light" }}>
                      <Typography fontWeight={750}>{describeHistoryEntry(entry)}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {entry.usuario?.nome || "Sistema"} • {formatDateTime(entry.createdAt)}
                      </Typography>
                    </Box>
                  ))}
                  {history.length === 0 && <Typography color="text.secondary">Sem alterações registradas.</Typography>}
                </Stack>
                {historyMeta.totalPages > 1 && (
                  <Stack alignItems="center" sx={{ mt: 2.5 }}>
                    <Pagination
                      size="small"
                      page={historyPage}
                      count={historyMeta.totalPages}
                      color="primary"
                      onChange={(event, value) => setHistoryPage(value)}
                    />
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
        onConfirm={executeConfirmation}
        loading={confirming}
        title="Desativar imóvel"
        description="O imóvel deixará de aparecer no portfólio."
        confirmLabel="Desativar"
      />
    </MainLayout>
  );
}
