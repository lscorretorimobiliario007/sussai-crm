import { useCallback, useEffect, useState } from "react";
import { Box, Button as MuiButton, Paper, Stack, Typography } from "@mui/material";
import { Close, NavigateBefore, NavigateNext } from "@mui/icons-material";

const TOUR_STORAGE_KEY = "sussai_tour_done_v1";

const STEPS = [
  {
    id: "welcome",
    title: "Bem-vindo ao SUSSAI",
    body: "Este tour rápido mostra os módulos principais usados nas demonstrações comerciais.",
    selector: null,
  },
  {
    id: "dashboard",
    title: "Dashboard executivo",
    body: "Acompanhe imóveis, pipeline, financeiro e comissões em um único painel.",
    selector: "[data-tour='dashboard-metrics']",
  },
  {
    id: "sidebar",
    title: "Navegação",
    body: "Use o menu lateral para Imóveis, Clientes, Agenda, Pipeline, Proprietários, Corretores e Financeiro.",
    selector: "[data-tour='sidebar']",
  },
  {
    id: "demo-mode",
    title: "Modo Demonstração",
    body: "Reinicie os dados fictícios a qualquer momento para repetir a apresentação do zero.",
    selector: "[data-tour='demo-mode']",
  },
  {
    id: "finish",
    title: "Pronto para apresentar",
    body: "Explore o pipeline, agende uma visita e mostre o financeiro. Bom pitch!",
    selector: null,
  },
];

export function shouldAutoStartTour(usuario) {
  if (!usuario) return false;
  return localStorage.getItem(TOUR_STORAGE_KEY) !== "1";
}

export function markTourDone() {
  localStorage.setItem(TOUR_STORAGE_KEY, "1");
}

export function resetTourFlag() {
  localStorage.removeItem(TOUR_STORAGE_KEY);
}

export default function GuidedTour({ open, onClose }) {
  const [index, setIndex] = useState(0);
  const [spotlight, setSpotlight] = useState(null);
  const step = STEPS[index];

  const measure = useCallback(() => {
    if (!open || !step?.selector) {
      setSpotlight(null);
      return;
    }
    const el = document.querySelector(step.selector);
    if (!el) {
      setSpotlight(null);
      return;
    }
    const rect = el.getBoundingClientRect();
    setSpotlight({
      top: rect.top + window.scrollY - 8,
      left: rect.left + window.scrollX - 8,
      width: rect.width + 16,
      height: rect.height + 16,
    });
    el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
  }, [open, step]);

  useEffect(() => {
    if (!open) return undefined;
    setIndex(0);
    const frame = requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, measure]);

  useEffect(() => {
    measure();
  }, [index, measure]);

  if (!open) return null;

  const finish = () => {
    markTourDone();
    onClose?.();
  };

  return (
    <Box sx={{ position: "fixed", inset: 0, zIndex: 2000, pointerEvents: "none" }}>
      <Box sx={{ position: "absolute", inset: 0, bgcolor: "rgba(2,6,23,.55)", pointerEvents: "auto" }} onClick={finish} />
      {spotlight && (
        <Box
          sx={{
            position: "absolute",
            top: spotlight.top,
            left: spotlight.left,
            width: spotlight.width,
            height: spotlight.height,
            borderRadius: 3,
            boxShadow: "0 0 0 9999px rgba(2,6,23,.55), 0 0 0 3px #60a5fa",
            pointerEvents: "none",
            transition: "all 220ms ease",
          }}
        />
      )}
      <Paper
        elevation={8}
        sx={{
          position: "fixed",
          right: { xs: 16, md: 32 },
          bottom: { xs: 16, md: 32 },
          width: { xs: "calc(100% - 32px)", sm: 380 },
          p: 2.5,
          borderRadius: 3,
          pointerEvents: "auto",
          animation: "sussaiFadeUp .28s ease",
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
          <Typography variant="overline" color="primary.main" fontWeight={800}>
            Tour {index + 1}/{STEPS.length}
          </Typography>
          <MuiButton size="small" color="inherit" onClick={finish} aria-label="Fechar tour" sx={{ minWidth: 0 }}>
            <Close fontSize="small" />
          </MuiButton>
        </Stack>
        <Typography variant="h6" fontWeight={850}>{step.title}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, mb: 2 }}>{step.body}</Typography>
        <Stack direction="row" justifyContent="space-between">
          <MuiButton
            size="small"
            startIcon={<NavigateBefore />}
            disabled={index === 0}
            onClick={() => setIndex((value) => Math.max(0, value - 1))}
          >
            Voltar
          </MuiButton>
          {index === STEPS.length - 1 ? (
            <MuiButton variant="contained" onClick={finish}>Concluir</MuiButton>
          ) : (
            <MuiButton
              variant="contained"
              endIcon={<NavigateNext />}
              onClick={() => setIndex((value) => Math.min(STEPS.length - 1, value + 1))}
            >
              Próximo
            </MuiButton>
          )}
        </Stack>
      </Paper>
    </Box>
  );
}
