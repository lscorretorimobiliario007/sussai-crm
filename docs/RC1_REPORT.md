# SUSSAI — Release Candidate 1 (RC1)

**Status:** concluída — aguardando aprovação  
**Data:** 2026-07-16  
**Escopo:** estabilização operacional (CRM + Site Top Conceição)  
**Regra:** nenhum módulo novo — revisar, integrar, otimizar e estabilizar

---

## Objetivo

Deixar o SUSSAI e o portal prontos para operação real da Top Conceição Imóveis.

---

## Gates executados

| Comando | Resultado |
|---------|-----------|
| `npm run check` (raiz) | OK — backend boot + lint frontend + lint site |
| `npm run build` (raiz) | OK — validate backend + build frontend + build site |
| `npx prisma migrate deploy` | OK — migration `20260716200000_rc1_indexes` |

Scripts de orquestração adicionados em `package.json` (raiz).

---

## Revisões por área

### Login / Registrar
- Login: hint de senha (mín. 8 caracteres)
- Registrar alinhado ao visual do Login (split hero, DS `Button`/`Card`/`Input`, show/hide senha, validação de senha)

### Dashboard / Imóveis / Clientes / Proprietários / Corretores / Agenda / Pipeline / Financeiro
- Já usavam Design System (toast, skeleton, empty states) — mantidos
- Import morto corrigido em `Corretores.jsx` (`TrendingUp`)

### Tarefas / Contratos / Configurações (legado RC1)
- Removidos `alert` / `console.error` → `useToast` + `ConfirmDialog`
- Skeleton + `EmptyState` + `ui/Button` / `ui/Card`
- Loading/saving states e validações de formulário

### Site
- `loading.tsx` global
- `next.config`: AVIF/WebP, `compress`, `poweredByHeader: false`
- Alt text nas miniaturas da galeria
- Dev/start na porta 3001
- Integração Sprint 2 mantida (API pública, SEO, leads)

### Banco
Índices RC1 (performance / joins multiempresa):

- `Cliente(empresaId, cpfCnpj)`
- `Lead(empresaId, clienteId|imovelId)`
- `Tarefa(empresaId, leadId|clienteId)`
- `EventoAgenda(empresaId, clienteId|imovelId|leadId)`

### APIs
- **Swagger UI:** `http://localhost:3000/api/docs`
- **OpenAPI JSON:** `/api/docs/openapi.json`
- Erros padronizados `{ erro }`
- Writes financeiros de categoria/centro de custo com `updateMany` escopado por `empresaId`

### Código morto
- Removido `frontend/src/components/layout/Header.jsx` (re-export morto)

---

## UX padronizada (DS)

| Padrão | Componente |
|--------|------------|
| Botões com loading | `components/ui/Button` |
| Toasts | `Toast` / `useToast` |
| Skeleton | `Loading variant="skeleton"` |
| Empty states | `EmptyState` |
| Confirmações | `ConfirmDialog` |
| Cards | `components/ui/Card` |

Páginas legadas (Tarefas, Contratos, Configurações, Registrar) foram alinhadas a esse padrão.

---

## Segurança multiempresa

- Leituras continuam com `empresaScope` / ownership
- Atualização de categoria e centro de custo reforçada com `updateMany({ id, empresaId })`
- Site público isolado por `SITE_EMPRESA_ID`

---

## Como operar (Top Conceição)

1. Backend com `SITE_EMPRESA_ID` da empresa Top Conceição  
2. `CORS_ORIGIN` incluindo origem do site (`http://localhost:3001`)  
3. Imóveis com **Publicado no site** no CRM  
4. Site apontando `NEXT_PUBLIC_SUSSAI_API_URL` / `SUSSAI_API_URL`  
5. Formulários do site → Lead → Pipeline → Agenda (visita)

---

## Fora de escopo (intencional)

- Novos módulos de negócio
- Suíte de testes automatizados E2E
- CMS de blog no CRM
- Docker de produção / CI remoto

---

## Arquivos principais tocados

- `frontend/src/pages/{Tarefas,Contratos,Configuracoes,Registrar,Login,Corretores}.jsx`
- `backend/src/docs/openapi.js`, `routes/docsRoutes.js`, `routes/index.js`
- `backend/prisma/schema.prisma` + migration RC1 indexes
- `backend/src/controllers/financeiroController.js`
- `top-conceicao-site` (loading, next.config, gallery, package scripts)
- `package.json` (raiz), `README.md`, `CHANGELOG.md`

---

**Aguardando aprovação da RC1.**
