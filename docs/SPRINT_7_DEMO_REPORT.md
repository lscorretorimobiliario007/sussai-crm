# SUSSAI CRM — Relatório Sprint 7 Demo (Preparação comercial)

**Data:** 16/Jul/2026  
**Baseline:** [SPRINT_7_REPORT.md](SPRINT_7_REPORT.md) · Sprint 7 aprovada  
**Status:** Concluída  
**Escopo:** polish comercial + ambiente de demonstração (sem novos módulos)

## Objetivo

Preparar o SUSSAI para demonstrações comerciais: UI polida nos módulos existentes, tour guiado, seed de dados fictícios, usuário DEMO e dashboard executivo impressionante.

## Credenciais DEMO

| Campo | Valor |
|-------|-------|
| E-mail | `demo@sussai.com.br` |
| Senha | `123456` |
| Empresa | SUSSAI Demonstração (`empresa.demo@sussai.com.br`) |
| Seed CLI | `cd backend && npm run seed:demo` |
| Entrada rápida | Botão **Entrar em Modo Demonstração** na tela de Login |
| Reinício | Chip **Modo Demonstração** na Navbar (ou menu do usuário) |

## Entregas

### Backend

- `backend/src/services/demoSeed.js` — seed completo e idempotente com `ensureDemoEnvironment({ reset })`
- `backend/src/controllers/demoController.js` — `POST /auth/demo` e `POST /auth/demo/reset`
- `backend/prisma/seed-demo.js` + script `npm run seed:demo`
- Login marca `demo: true` quando o e-mail é `demo@sussai.com.br`

### Dados fictícios gerados

| Entidade | Quantidade aproximada |
|----------|----------------------|
| Corretores / equipe | 3 usuários + 1 admin + 1 equipe |
| Proprietários | 3 |
| Clientes | 4 |
| Imóveis | 6 (venda, locação, reservado, vendido, alugado) |
| Leads / pipeline | 5 oportunidades em etapas distintas |
| Agenda | 3 compromissos |
| Tarefas | 3 |
| Contratos | 2 (aluguel + venda) |
| Cobranças / lançamentos / comissões / caixa | conjunto operacional realista |

### Frontend — polish

- **Login:** CTA de Modo Demonstração, tipografia e hierarquia reforçadas
- **Dashboard:** hero demo, cards premium, gráficos modernos, skeleton loading, empty states
- **DS:** `Card` premium, `EmptyState` e `Loading` (skeleton) com animações `sussaiFadeUp`
- **Módulos existentes:** mantidos com skeleton/empty/toast já padronizados (Imóveis, Clientes, Agenda, Pipeline, Proprietários, Corretores, Financeiro)
- **Tour guiado:** `GuidedTour` com spotlight nos pontos `dashboard-metrics`, `sidebar`, `demo-mode`
- **Navbar:** chip Modo Demonstração, reinício de dados e atalho de tour
- **Auth:** `entrarDemo` / `resetarDemo` no `AuthContext`

## Como apresentar

1. Abrir Login → **Entrar em Modo Demonstração** (ou login com as credenciais acima).
2. Seguir o tour guiado (auto-start na primeira sessão; reiniciável pelo ícone de tour).
3. Percurso sugerido: Dashboard → Pipeline → Imóveis → Agenda → Financeiro → Proprietários/Corretores.
4. Se o ambiente “sujou” durante o pitch: clicar **Modo Demonstração** / **Reiniciar demonstração**.

## Auditoria automática

| Verificação | Resultado |
|-------------|-----------|
| `npm run seed:demo` | OK — 6 imóveis, 7 clientes (incl. proprietários), 5 leads, 2 contratos |
| `npm run check` (backend) | OK |
| `npm run build` (frontend) | OK |

### Correções na revisão

- `CorretorEquipe.descricao` removido do seed (campo inexistente no schema)
- `Imovel.area` → `areaUtil` / `areaConstruida` / `areaTerreno`
- Ícones MUI: `PlayCircleOutline` → `PlayCircleOutlined`

## Fora de escopo (intencional)

- Nenhum módulo novo (Sprint 8+)
- Sem mudança de regras de negócio além do necessário para demo
- Senha demo `123456` é intencional para pitch; signup público continua exigindo senha forte

## Arquivos principais

- `backend/src/services/demoSeed.js`
- `backend/src/controllers/demoController.js`
- `backend/src/routes/authRoutes.js`
- `frontend/src/pages/Login.jsx`
- `frontend/src/pages/Dashboard.jsx`
- `frontend/src/components/tour/GuidedTour.jsx`
- `frontend/src/components/layout/{MainLayout,Navbar,Sidebar}.jsx`
- `frontend/src/context/AuthContext.jsx`
- `docs/SPRINT_7_DEMO_REPORT.md`
- `CHANGELOG.md`
