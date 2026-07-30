# SUSSAI CRM — Auditoria Técnica do MVP

**Data:** 16/Jul/2026  
**Fase:** Estabilização do MVP (pós Sprint 6)  
**Escopo:** Arquitetura, segurança, performance, banco, APIs, frontend, UX/a11y, Design System, integrações  
**Regra:** nenhum módulo novo · Sprint 7 não iniciada

---

## Veredito

O MVP está **operacional e utilizável** nos fluxos centrais (Login → Dashboard → Clientes → Imóveis → Agenda → Pipeline → Proprietários → Corretores). A base multiempresa (`empresaId` + `ownershipScope` + `pickFields`) é sólida.

A estabilização desta rodada **corrigiu riscos críticos** (escalação de privilégio, listas sem limite, vazamento de contadores para CORRETOR, avatar quebrado, leak de blobs). Permanecem dívidas conscientes em Contratos/Tarefas/Financeiro (UI legado), signup público, e-mail globalmente único e RBAC de `permissoes` ainda não enforçado.

| Dimensão | Nota MVP | Situação |
|----------|----------|----------|
| Arquitetura | 7/10 | Controllers gordos, padrão claro, sem camada de serviço |
| Segurança | 7.5/10 | Isolation forte; signup aberto e JWT sem refresh |
| Performance | 7/10 | Índices novos; N+1 em ranking de corretores |
| Banco | 8/10 | Schema rico; índices hot-path aplicados |
| APIs | 8/10 | Paginação/limites nos módulos críticos |
| Frontend / DS | 7/10 | Core premium; 4 telas legadas |
| A11y / Responsivo | 6.5/10 | Melhorou overflow; DnD e cards ainda fracos |
| Integrações | 7.5/10 | Fluxos principais OK; Agenda↔Visita parcial |

---

## Fluxo funcional validado

| Etapa | Status | Observação |
|-------|--------|------------|
| Login | OK | Rate limit 20/15min; JWT 8h |
| Dashboard | OK | Contadores de clientes/proprietários respeitam ownership do CORRETOR |
| Clientes | OK | Exclui PROPRIETÁRIO por padrão; avatar autenticado |
| Imóveis | OK | Opções de proprietário com ownership |
| Agenda | OK | Módulo mais maduro |
| Pipeline | OK | Limite 500 cards; dashboard capped 2000 |
| Proprietários | OK | Contatos sync no create; docs via API clientes |
| Corretores | OK | Bloqueio GERENTE→ADMIN no update |

---

## Achados por severidade

### Críticos (corrigidos nesta rodada)

1. **GERENTE podia promover a ADMIN** em `atualizarCorretor` — espelhado o guard de criação.
2. **Avatar de clientes** sempre `undefined` — usa `AuthenticatedImage`.
3. **Cache de blob sem limite** em `AuthenticatedImage` — LRU 80 + revoke.
4. **Listas sem teto** (contratos, tarefas, cobranças, leads) — paginação ou `take` máximo.

### Altos (corrigidos ou mitigados)

| Item | Ação |
|------|------|
| Rate limit em `/auth/login` e `/auth/registrar` | Implementado (in-memory) |
| Signup público | Gate `ALLOW_PUBLIC_SIGNUP=false` |
| CORRETOR via contadores globais no dashboard | Scoped com `corretorScope` |
| `listarOpcoesImovel` sem ownership | Ownership + `take` |
| Clientes misturando proprietários | Filtro default + bloqueio no create |
| Upload de anexos de lead antes do access check | `ensureActiveLeadAccess` antes do multer |
| Soft delete sem limpar token de compartilhamento | `tokenCompartilhamento: null` |
| Índices ausentes em Contrato/Cobranca/Tarefa | Migration `20260716120000_mvp_indexes` |
| bcrypt 10 vs 12 nos corretores | Unificado em 12 |
| Contrato aceitando qualquer cliente como proprietário | Valida `tipo: PROPRIETARIO` |

### Médios (parcialmente corrigidos / backlog)

| Item | Status |
|------|--------|
| Contratos/Tarefas/Financeiro/Config fora do DS | UI legado; try/catch + overflow adicionados |
| `permissoes[]` do corretor não enforçadas | Documentado — decisão de produto |
| Agenda não sincroniza status de `ClienteVisita` no concluir/cancelar | Backlog |
| Dual `Lead.status` + `PipelineEtapa` | Backlog |
| Compartilhar cliente exige auth (não é link público) | Decisão de produto |
| N+1 em ranking/lista de corretores | Backlog de performance |
| E-mail `@unique` global | Decisão SaaS (migration + UX) |

### Baixos

- `Header.jsx` re-export morto de Navbar
- `ensureEventoAccess` não usado em rotas de agenda
- `VISITA_AGENDADA` no enum sem uso no pipeline
- Notificação do Navbar era botão morto — removida
- `optionLabel` duplicado em utils

---

## Correções aplicadas (checklist técnico)

### Backend
- [x] Privilege escalation GERENTE→ADMIN
- [x] Rate limit auth
- [x] `ALLOW_PUBLIC_SIGNUP`
- [x] Paginação contratos/tarefas/cobranças; cap leads/pipeline dashboard
- [x] Ownership dashboard + opções imóvel
- [x] Exclusão PROPRIETARIO em `/clientes`
- [x] Lead access antes de upload
- [x] Token share null no soft delete
- [x] Índices Prisma + migration
- [x] Validação proprietário em contratos
- [x] Cap favoritos (50); usuários take 500
- [x] bcrypt 12

### Frontend
- [x] Avatar clientes
- [x] LRU AuthenticatedImage
- [x] TIPOS_CLIENTE sem PROPRIETARIO
- [x] Resposta paginada em Contratos/Tarefas/Financeiro
- [x] Overflow horizontal nas tabelas legadas
- [x] CorretorForm redirect via `useEffect`
- [x] Contatos do proprietário no create
- [x] Excel blob error parsing
- [x] Logout com navigate; botão notificações morto removido

### Validação
- [x] `npx prisma migrate deploy` OK
- [x] `npm run check` (backend) OK
- [x] `npm run build` (frontend) OK

---

## Arquitetura atual (resumo)

```
frontend (Vite/React/MUI)  →  axios + JWT
backend (Express 5)        →  controllers + middleware
Prisma 6                   →  PostgreSQL multi-tenant
uploads/                   →  disco local por empresa
```

**Pontos fortes:** isolation, allowlists, soft delete nos módulos core, DS SUSSAI nos módulos Sprint 2–6.

**Pontos fracos:** fat controllers, módulos pré-DS, sem testes automatizados, sem Helmet/CSP completo.

---

## Decisões conscientes (não auto-corrigidas)

1. Signup público permanece **ligado por padrão** em dev (`ALLOW_PUBLIC_SIGNUP=true`); desligar em produção.
2. E-mail único **global** permanece (mudança exige login com empresa/slug).
3. `permissoes` do corretor ficam na UI/API mas **não filtram rotas** até decisão de RBAC.
4. Contratos/Tarefas/Financeiro/Config **não foram redesignados** (escopo = estabilizar, não Sprint 7).
5. Kanban de leads limita a **500** oportunidades por request (meta `truncated` se excedido).

---

## Referências

- [MVP_CHECKLIST.md](MVP_CHECKLIST.md) — checklist operacional
- [ROAD_TO_V1.md](ROAD_TO_V1.md) — caminho até v1
- [SPRINT_6_REPORT.md](SPRINT_6_REPORT.md) — última sprint de produto
- [TODO.md](TODO.md) — backlog restante
