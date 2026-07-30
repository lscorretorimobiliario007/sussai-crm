# SUSSAI CRM — Relatório da Sprint 1

**Data:** 15/Jul/2026  
**Baseline:** [AUDITORIA.md](AUDITORIA.md)  
**Visão:** [MASTER_PLAN.md](MASTER_PLAN.md)

## Entregas

### Segurança e multiempresa

- Corrigidas as 6 operações IDOR identificadas na auditoria.
- `empresaId` passou a vir exclusivamente do usuário autenticado.
- Removido mass assignment (`req.body` direto no Prisma) dos controllers.
- Criadas listas explícitas de campos permitidos por entidade.
- Relações com usuário, imóvel, cliente e contrato são validadas por empresa.
- Corretores ficaram limitados aos próprios imóveis, leads, contratos e tarefas.
- Financeiro protegido para ADMIN e GERENTE no backend e frontend.
- Dashboard de corretor não consulta nem retorna dados financeiros.
- Token JWT agora confirma usuário e empresa ativos no banco a cada requisição.
- Verificação JWT restrita explicitamente ao algoritmo HS256.
- CORS restrito por `CORS_ORIGIN`, body limitado a 1 MB e headers básicos adicionados.
- Senhas novas exigem 8 caracteres e usam bcrypt cost 12.
- Relações históricas aninhadas são sanitizadas antes da resposta.
- Corretores criam contratos apenas como rascunho; ativação e encerramento exigem ADMIN ou GERENTE.
- Estados vendido/alugado do imóvel são derivados de contratos, não de edição manual.
- Cobranças novas não podem ser criadas artificialmente como pagas.

### Design System

- Tokens oficiais de cor, radius, sombras, tipografia e espaçamento.
- Temas claro e escuro persistidos em `localStorage`.
- Overrides globais para Button, Card, Input, Dialog, Table e Chip.
- Acessibilidade para redução de movimento e estados de foco/feedback.

### Componentes reutilizáveis

- `Button`
- `Input`
- `Select`
- `Modal`
- `Card`
- `DataTable`
- `Sidebar`
- `Navbar`
- `Loading`
- `EmptyState`
- `ConfirmDialog`
- `Toast`

### Layout premium

- Sidebar redesenhada com navegação por perfil.
- Drawer responsivo em mobile.
- Navbar com blur, identificação da empresa, avatar e alternância de tema.
- Conteúdo com largura máxima, espaçamento responsivo e transição suave.

### Dashboard

- Saudação contextual.
- Cards de KPI responsivos.
- Visão financeira condicionada ao perfil.
- Gráficos de progresso modernizados.
- Tabelas reutilizáveis para leads e cobranças.
- Estados de loading, vazio e erro com retry.
- Navegação direta para módulos relacionados.

### Login

- Layout premium dividido em desktop.
- Identidade SUSSAI consolidada.
- Benefícios do produto em destaque.
- Tema claro/escuro.
- Formulário acessível e responsivo.
- Feedback de erro e loading.

## Verificação

Não havia testes automatizados no repositório.

Foram solicitadas as seguintes verificações:

1. `npm run lint` no frontend.
2. `npm run build` no frontend.
3. `node --check` nos arquivos alterados do backend.
4. Inicialização do backend.
5. Inicialização do frontend.

O executor de terminal do ambiente falhou antes de iniciar comandos, retornando “no exit status” inclusive para comandos básicos. Por isso, a execução não pôde ser comprovada nesta sessão.

Como contingência, foram feitas revisões estáticas independentes de sintaxe, imports, APIs MUI, hooks, Prisma, concorrência e segurança. Os bloqueadores encontrados foram corrigidos e revisados novamente, sem bloqueadores estáticos remanescentes. A comprovação executável continua pendente até que o terminal esteja disponível.

## Arquivos criados

### Backend

- `backend/src/utils/security.js`
- `backend/src/utils/financeiro.js`
- `backend/src/middleware/validateId.js`

### Frontend

- `frontend/src/context/ThemeModeContext.jsx`
- `frontend/src/components/layout/Navbar.jsx`
- `frontend/src/components/ui/Button.jsx`
- `frontend/src/components/ui/Input.jsx`
- `frontend/src/components/ui/Select.jsx`
- `frontend/src/components/ui/Modal.jsx`
- `frontend/src/components/ui/Card.jsx`
- `frontend/src/components/ui/DataTable.jsx`
- `frontend/src/components/ui/Loading.jsx`
- `frontend/src/components/ui/EmptyState.jsx`
- `frontend/src/components/ui/ConfirmDialog.jsx`
- `frontend/src/components/ui/Toast.jsx`

### Documentação

- `docs/SPRINT_1_REPORT.md`

## Arquivos alterados

### Backend

- `backend/src/app.js`
- `backend/src/middleware/auth.js`
- `backend/src/utils/helpers.js`
- `backend/src/controllers/authController.js`
- `backend/src/controllers/dashboardController.js`
- `backend/src/controllers/imovelController.js`
- `backend/src/controllers/clienteController.js`
- `backend/src/controllers/leadController.js`
- `backend/src/controllers/contratoController.js`
- `backend/src/controllers/financeiroController.js`
- `backend/src/controllers/tarefaController.js`
- `backend/src/routes/authRoutes.js`
- `backend/src/routes/imovelRoutes.js`
- `backend/src/routes/clienteRoutes.js`
- `backend/src/routes/leadRoutes.js`
- `backend/src/routes/contratoRoutes.js`
- `backend/src/routes/financeiroRoutes.js`
- `backend/src/routes/tarefaRoutes.js`
- `backend/src/server.js`
- `backend/.env.example`
- `backend/package.json`
- `backend/package-lock.json`

### Frontend

- `frontend/src/App.jsx`
- `frontend/src/api/axios.js`
- `frontend/src/context/AuthContext.jsx`
- `frontend/src/theme/theme.js`
- `frontend/src/components/layout/MainLayout.jsx`
- `frontend/src/components/layout/Sidebar.jsx`
- `frontend/src/components/layout/Header.jsx`
- `frontend/src/pages/Dashboard.jsx`
- `frontend/src/pages/Login.jsx`
- `frontend/src/pages/Imoveis.jsx`
- `frontend/src/pages/Clientes.jsx`
- `frontend/src/pages/Contratos.jsx`
- `frontend/src/pages/Tarefas.jsx`
- `frontend/src/index.css`
- `frontend/index.html`
- `frontend/eslint.config.js`
- `frontend/package.json`
- `frontend/package-lock.json`

### Documentação

- `README.md`
- `.gitignore`
- `docs/AUDITORIA.md`
- `docs/ROADMAP.md`

## Dependências

Nenhuma dependência foi adicionada. A Sprint reutiliza React, Material UI, React Router, Axios, Express, Prisma, JWT, bcrypt e CORS já instalados.

Foi declarado Node.js `>=20` nos manifests do backend e frontend, compatível com React Router 7.

## Erros corrigidos na revisão final

- Interceptor Axios não recarrega mais a página em credenciais inválidas no Login/Registro.
- Contrato não tenta mais converter data inicial vazia, evitando `RangeError`.
- Props removidas no Material UI 9 foram migradas para `slotProps`.
- IDs inválidos em parâmetros retornam HTTP 400 em vez de erro interno.
- Exclusão de lead com tarefas retorna conflito orientativo em vez de erro Prisma `P2003`.
- Geração de códigos deixou de usar `count + 1`, eliminando colisões previsíveis sob concorrência.
- Geração mensal de cobranças passou a usar transação serializável.
- Alteração de status do contrato sincroniza o status do imóvel.
- Imóveis desativados não aparecem mais na listagem.
- JSON malformado retorna HTTP 400.
- Inicialização do backend falha imediatamente se `DATABASE_URL` ou `JWT_SECRET` estiverem ausentes.
- Storage local corrompido não derruba mais o frontend na inicialização.
- `.env` está protegido por regras de `.gitignore`.

## Comandos para validação local

### Pré-requisitos

```powershell
node --version
npm --version
psql --version
```

Node deve ser 20 ou superior. PostgreSQL deve estar acessível pela `DATABASE_URL`.

### Backend

```powershell
cd C:\projetos\sistema-imobiliaria\backend
if (!(Test-Path .env)) { Copy-Item .env.example .env }
# Edite .env e defina DATABASE_URL, JWT_SECRET e CORS_ORIGIN
npm install
npx prisma generate
npx prisma migrate deploy
npm run validate
npm run dev
```

Validação adicional do backend:

```powershell
cd C:\projetos\sistema-imobiliaria\backend
node --check src\app.js
node --check src\server.js
node --check src\middleware\auth.js
node --check src\utils\security.js
node --check src\controllers\authController.js
node --check src\controllers\dashboardController.js
node --check src\controllers\imovelController.js
node --check src\controllers\clienteController.js
node --check src\controllers\leadController.js
node --check src\controllers\contratoController.js
node --check src\controllers\financeiroController.js
node --check src\controllers\tarefaController.js
```

Com o backend iniciado:

```powershell
Invoke-RestMethod http://localhost:3000
```

### Frontend

Em outro terminal:

```powershell
cd C:\projetos\sistema-imobiliaria\frontend
if (!(Test-Path .env)) { Copy-Item .env.example .env }
npm install
npm run validate
npm run dev
```

Acesse `http://localhost:5173`.

## Limites da Sprint

- Nenhum módulo novo foi iniciado.
- Não foram implementados Docker, Swagger, CI/CD ou migração TypeScript.
- As telas CRUD existentes ainda não foram migradas integralmente para os novos componentes.

## Status

Implementação da Sprint 1 concluída. Aguardando aprovação antes de iniciar outro módulo.
