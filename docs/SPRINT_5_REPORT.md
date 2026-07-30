# SUSSAI CRM — Relatório da Sprint 5

**Data:** 16/Jul/2026  
**Baseline:** [SPRINT_4_REPORT.md](SPRINT_4_REPORT.md)  
**Visão:** [MASTER_PLAN.md](MASTER_PLAN.md)  
**Status:** Concluída — aguardando aprovação  
**Posicionamento:** SUSSAI tratado como produto comercial — experiência de pipeline pensada para a rotina da imobiliária

## Objetivo

Pipeline Comercial (CRM) completo: kanban com drag-and-drop, etapas personalizáveis, oportunidades com probabilidade/valor/previsão, ganho/perda com motivo, timeline, comentários, anexos, tarefas e agenda vinculadas, dashboard comercial com funil e indicadores — integrado a Clientes, Imóveis, Agenda e Dashboard.

## Auditoria final

| Camada | Resultado |
|--------|-----------|
| Prisma ↔ Migration `20260716060000_pipeline_crm` | Alinhados |
| APIs ↔ Frontend Kanban | `PATCH /leads/:id/mover` + `@dnd-kit` |
| Multiempresa / ownership (`corretorId`) | OK |
| Motivo da perda obrigatório em etapa PERDIDO | OK |
| Integração Agenda / Tarefas a partir do lead | OK |
| Dashboard geral com etapa nos leads recentes | OK |
| Backend `npm run check` | OK |
| Frontend `npm run build` | OK |
| Migration deploy local | Aplicada |

### Correções na revisão

- DragOverlay sem `useSortable` (card estático) para evitar erro de contexto DnD
- Dialog de perda via `Modal` (ConfirmDialog não aceita children)

## Entregas

### Banco

- `PipelineEtapa` (etapas personalizáveis por empresa: nome, código, ordem, cor, tipo ABERTA/GANHO/PERDIDO, probabilidade padrão)
- `Lead` expandido: `etapaId`, `valorPrevisto`, `probabilidade`, `previsaoFechamento`, `motivoPerda`, `ativo`
- `LeadHistorico`, `LeadComentario`, `LeadAnexo`
- Seed de etapas padrão + mapeamento do `StatusLead` legado

### APIs principais

| Método | Rota | Função |
|--------|------|--------|
| GET | `/leads/opcoes` | Etapas, corretores, clientes, imóveis, motivos |
| GET | `/leads/dashboard` | Indicadores + funil |
| GET/POST/PUT | `/leads/etapas*` | CRUD e reordenação de etapas |
| GET/POST | `/leads` | Board + criação |
| GET/PUT/DELETE | `/leads/:id` | Detalhe, edição, soft archive |
| PATCH | `/leads/:id/mover` | Movimentação (DnD) |
| POST | `/leads/:id/comentarios` | Comentários |
| POST/GET/DELETE | `/leads/:id/anexos*` | Anexos |
| POST | `/leads/:id/tarefas` | Tarefa vinculada |
| POST | `/leads/:id/agenda` | Compromisso na Agenda |
| GET | `/leads/:id/historico` | Timeline paginada |

### Frontend

- Kanban premium com `@dnd-kit` (arrastar entre etapas)
- Dashboard comercial (aberto, valor no funil, ponderado, conversão, ganhos, previsão do mês)
- Funil de conversão visual
- Drawer de detalhe: probabilidade, vínculos, comentários, anexos, tarefas, agenda, timeline
- Criação de oportunidade e de etapas (ADMIN/GERENTE)
- Pesquisa + filtros (corretor, cliente, imóvel, origem)
- Sidebar: **Pipeline CRM**
- Design System SUSSAI exclusivo

### Integrações

- **Clientes / Imóveis / Corretores** no cadastro e filtros
- **Agenda** via `POST /leads/:id/agenda`
- **Tarefas** via `POST /leads/:id/tarefas`
- **Dashboard** exibe etapa nos leads recentes e conta apenas leads ativos

## Arquivos principais

- `backend/prisma/migrations/20260716060000_pipeline_crm/`
- `backend/src/controllers/leadController.js`
- `backend/src/routes/leadRoutes.js`
- `backend/src/middleware/leadUpload.js`
- `frontend/src/pages/Leads.jsx`
- `frontend/src/utils/pipeline.js`
- `frontend/src/pages/Dashboard.jsx`
- `docs/SPRINT_5_REPORT.md`, `docs/TODO.md`, `CHANGELOG.md`

## Dependências novas

- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`

## Como validar

```powershell
cd C:\projetos\sistema-imobiliaria\backend
npx prisma migrate deploy
npm run check
npm run dev

cd C:\projetos\sistema-imobiliaria\frontend
npm run build
npm run dev
```

1. Abrir Pipeline CRM e arrastar cards entre colunas  
2. Mover para Perdido e informar motivo  
3. Abrir drawer: comentar, anexar, criar tarefa e agendar visita  
4. Conferir funil e indicadores  
5. Criar etapa personalizada (ADMIN/GERENTE)  
6. Validar isolamento do corretor  

## Limites conscientes

- Sem scoring por IA  
- Sem automação de e-mail/WhatsApp no avanço de etapa  
- Anexos em disco local  

## Conclusão

Sprint 5 **implementada e validada**. O Pipeline Comercial está pronto para uso comercial na imobiliária.

**Não iniciar outra sprint sem aprovação explícita.**
