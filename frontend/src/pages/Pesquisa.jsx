import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Chip,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import { SearchOffOutlined } from "@mui/icons-material";
import { useNavigate, useSearchParams } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import Input from "../components/ui/Input";
import Loading from "../components/ui/Loading";
import { useToast } from "../context/toast";
import api from "../api/axios";

function normalizeResults(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.results)) return data.results;

  const groups = [];
  const map = [
    ["imoveis", "Imóvel", "/imoveis"],
    ["clientes", "Cliente", "/clientes"],
    ["proprietarios", "Proprietário", "/proprietarios"],
    ["leads", "Lead", "/leads"],
    ["contratos", "Contrato", "/contratos"],
    ["corretores", "Corretor", "/corretores"],
  ];

  for (const [key, type, basePath] of map) {
    const list = data[key];
    if (!Array.isArray(list)) continue;
    for (const item of list) {
      groups.push({
        id: `${key}-${item.id}`,
        type,
        title: item.nome || item.titulo || item.codigo || `#${item.id}`,
        subtitle: item.email || item.cidade || item.status || "",
        href: item.href || `${basePath}/${item.id}`,
      });
    }
  }
  return groups;
}

export default function Pesquisa() {
  const toast = useToast();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const initial = params.get("q") || "";
  const [query, setQuery] = useState(initial);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (term) => {
    const value = String(term || "").trim();
    if (!value) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get("/search", { params: { q: value } });
      setResults(normalizeResults(data));
    } catch (error) {
      setResults([]);
      toast.error(error.response?.data?.erro || error.response?.data?.message || "Erro ao pesquisar.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    setQuery(initial);
    search(initial);
  }, [initial, search]);

  const submit = (event) => {
    event.preventDefault();
    const value = query.trim();
    setParams(value ? { q: value } : {});
  };

  return (
    <MainLayout title="Pesquisa">
      <Stack spacing={2.5}>
        <Box component="form" onSubmit={submit}>
          <Input
            label="Buscar no CRM"
            placeholder="Imóveis, clientes, leads, contratos..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </Box>

        <Card>
          {!initial ? (
            <EmptyState
              title="Digite para pesquisar"
              description="Use a busca global para encontrar registros em todo o CRM."
            />
          ) : loading ? (
            <Loading variant="skeleton" rows={5} />
          ) : results.length === 0 ? (
            <EmptyState
              icon={SearchOffOutlined}
              title="Nenhum resultado"
              description={`Nada encontrado para “${initial}”.`}
            />
          ) : (
            <List disablePadding>
              {results.map((item) => (
                <ListItemButton key={item.id} onClick={() => navigate(item.href)} sx={{ borderRadius: 2, mb: 0.5 }}>
                  <ListItemText
                    primary={(
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography fontWeight={750}>{item.title}</Typography>
                        <Chip size="small" label={item.type} />
                      </Stack>
                    )}
                    secondary={item.subtitle || item.href}
                  />
                </ListItemButton>
              ))}
            </List>
          )}
        </Card>
      </Stack>
    </MainLayout>
  );
}
