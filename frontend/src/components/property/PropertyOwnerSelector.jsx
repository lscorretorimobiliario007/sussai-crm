import { useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
  CircularProgress,
  Grid,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Add from "@mui/icons-material/Add";
import api from "../../api/axios";
import { buscarCep, formatCep } from "../../utils/cep";
import {
  formatCnpj,
  formatCpf,
  formatPhone,
} from "../../utils/clientes";
import { isValidCnpj, isValidCpf } from "../../utils/validators";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Modal from "../ui/Modal";
import { useToast } from "../ui/Toast";

const emptyOwner = {
  nome: "",
  cpf: "",
  cnpj: "",
  rg: "",
  telefone: "",
  celular: "",
  whatsapp: "",
  email: "",
  cep: "",
  rua: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
  observacoes: "",
};

function documentLabel(owner) {
  if (owner.cpf) return formatCpf(owner.cpf);
  if (owner.cnpj) return formatCnpj(owner.cnpj);
  return "Sem documento";
}

export default function PropertyOwnerSelector({
  owner,
  onChange,
  error,
  helperText,
}) {
  const toast = useToast();
  const [options, setOptions] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyOwner);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/proprietarios/opcoes", {
          params: search.trim() ? { busca: search.trim() } : undefined,
          signal: controller.signal,
        });
        setOptions(Array.isArray(data?.proprietarios) ? data.proprietarios : []);
      } catch (requestError) {
        if (requestError.code !== "ERR_CANCELED") {
          toast.error("Não foi possível pesquisar proprietários.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [search, toast]);

  const autocompleteOptions = useMemo(() => {
    if (!owner || options.some((item) => item.id === owner.id)) return options;
    return [owner, ...options];
  }, [options, owner]);

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

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

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setForm(emptyOwner);
    setErrors({});
  };

  const saveOwner = async () => {
    const nextErrors = {};
    if (!form.nome.trim()) nextErrors.nome = "Informe o nome.";
    if (form.cpf && !isValidCpf(form.cpf)) nextErrors.cpf = "CPF inválido.";
    if (form.cnpj && !isValidCnpj(form.cnpj)) nextErrors.cnpj = "CNPJ inválido.";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = "E-mail inválido.";
    }
    if (form.cep && form.cep.replace(/\D/g, "").length !== 8) {
      nextErrors.cep = "CEP inválido.";
    }
    if (form.estado && form.estado.length !== 2) {
      nextErrors.estado = "Informe a UF.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    try {
      const payload = Object.fromEntries(
        Object.entries(form).map(([key, value]) => {
          const normalized = ["cpf", "cnpj", "telefone", "celular", "whatsapp", "cep"]
            .includes(key)
            ? value.replace(/\D/g, "")
            : value.trim();
          return [key, normalized || null];
        })
      );
      const { data } = await api.post("/proprietarios", payload);
      onChange(data);
      setOptions((current) => [data, ...current.filter((item) => item.id !== data.id)]);
      toast.success("Proprietário criado e vinculado ao imóvel.");
      setModalOpen(false);
      setForm(emptyOwner);
      setErrors({});
    } catch (requestError) {
      const message = requestError.response?.data?.message || requestError.response?.data?.erro;
      toast.error(
        (Array.isArray(message) ? message.join(", ") : message)
        || "Erro ao cadastrar proprietário."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems="flex-start">
        <Autocomplete
          fullWidth
          options={autocompleteOptions}
          value={owner || null}
          loading={loading}
          inputValue={search}
          onInputChange={(_event, value) => setSearch(value)}
          onChange={(_event, value) => onChange(value)}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          getOptionLabel={(option) => option.nome || ""}
          noOptionsText="Nenhum proprietário encontrado"
          renderOption={(props, option) => (
            <li {...props} key={option.id}>
              <Stack>
                <Typography fontWeight={750}>{option.nome}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {documentLabel(option)}
                </Typography>
              </Stack>
            </li>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Proprietário"
              required
              error={Boolean(error)}
              helperText={helperText || "Pesquise por nome, CPF ou CNPJ"}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loading ? <CircularProgress size={18} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />
        <Button
          variant="outlined"
          startIcon={<Add />}
          onClick={() => setModalOpen(true)}
          sx={{ minWidth: { xs: "100%", md: 220 }, minHeight: 56, whiteSpace: "nowrap" }}
        >
          Cadastrar Proprietário
        </Button>
      </Stack>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title="Novo proprietário"
        maxWidth="md"
        actions={(
          <>
            <Button color="inherit" onClick={closeModal} disabled={saving}>Cancelar</Button>
            <Button variant="contained" onClick={saveOwner} loading={saving}>Cadastrar e vincular</Button>
          </>
        )}
      >
        <Stack spacing={2.5}>
          <Typography variant="subtitle2" color="text.secondary">Dados pessoais</Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}><Input label="Nome" required value={form.nome} onChange={(event) => update("nome", event.target.value)} error={Boolean(errors.nome)} helperText={errors.nome} /></Grid>
            <Grid size={{ xs: 12, md: 4 }}><Input label="CPF" value={form.cpf} onChange={(event) => update("cpf", formatCpf(event.target.value))} error={Boolean(errors.cpf)} helperText={errors.cpf} /></Grid>
            <Grid size={{ xs: 12, md: 4 }}><Input label="CNPJ" value={form.cnpj} onChange={(event) => update("cnpj", formatCnpj(event.target.value))} error={Boolean(errors.cnpj)} helperText={errors.cnpj} /></Grid>
            <Grid size={{ xs: 12, md: 4 }}><Input label="RG" value={form.rg} onChange={(event) => update("rg", event.target.value)} /></Grid>
            <Grid size={{ xs: 12, md: 4 }}><Input label="Telefone" value={form.telefone} onChange={(event) => update("telefone", formatPhone(event.target.value))} /></Grid>
            <Grid size={{ xs: 12, md: 4 }}><Input label="Celular" value={form.celular} onChange={(event) => update("celular", formatPhone(event.target.value))} /></Grid>
            <Grid size={{ xs: 12, md: 4 }}><Input label="WhatsApp" value={form.whatsapp} onChange={(event) => update("whatsapp", formatPhone(event.target.value))} /></Grid>
            <Grid size={{ xs: 12 }}><Input label="E-mail" type="email" value={form.email} onChange={(event) => update("email", event.target.value)} error={Boolean(errors.email)} helperText={errors.email} /></Grid>
          </Grid>

          <Typography variant="subtitle2" color="text.secondary">Endereço</Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 3 }}><Input label="CEP" value={form.cep} onChange={(event) => handleCep(event.target.value)} error={Boolean(errors.cep)} helperText={errors.cep} InputProps={{ endAdornment: cepLoading ? <CircularProgress size={18} /> : null }} /></Grid>
            <Grid size={{ xs: 12, md: 7 }}><Input label="Rua" value={form.rua} onChange={(event) => update("rua", event.target.value)} /></Grid>
            <Grid size={{ xs: 12, md: 2 }}><Input label="Número" value={form.numero} onChange={(event) => update("numero", event.target.value)} /></Grid>
            <Grid size={{ xs: 12, md: 4 }}><Input label="Complemento" value={form.complemento} onChange={(event) => update("complemento", event.target.value)} /></Grid>
            <Grid size={{ xs: 12, md: 3 }}><Input label="Bairro" value={form.bairro} onChange={(event) => update("bairro", event.target.value)} /></Grid>
            <Grid size={{ xs: 12, md: 3 }}><Input label="Cidade" value={form.cidade} onChange={(event) => update("cidade", event.target.value)} /></Grid>
            <Grid size={{ xs: 12, md: 2 }}><Input label="UF" value={form.estado} onChange={(event) => update("estado", event.target.value.replace(/[^a-z]/gi, "").slice(0, 2).toUpperCase())} error={Boolean(errors.estado)} helperText={errors.estado} /></Grid>
            <Grid size={{ xs: 12 }}><Input label="Observações" multiline rows={3} value={form.observacoes} onChange={(event) => update("observacoes", event.target.value)} /></Grid>
          </Grid>
        </Stack>
      </Modal>
    </>
  );
}
