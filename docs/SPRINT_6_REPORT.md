# SUSSAI CRM — Relatório da Sprint 6

**Data:** 16/Jul/2026  
**Baseline:** [SPRINT_5_REPORT.md](SPRINT_5_REPORT.md)  
**Visão:** [MASTER_PLAN.md](MASTER_PLAN.md)  
**Status:** Concluída — aguardando aprovação  
**Posicionamento:** SUSSAI tratado como produto comercial — Proprietários e Corretores como eixos operacionais da imobiliária

## Objetivo

Módulos integrados de **Proprietários** e **Corretores**: cadastro completo, indicadores de performance, vínculos com Imóveis/Clientes/Agenda/Pipeline/Dashboard — exclusivamente no Design System SUSSAI.

## Auditoria final

| Camada | Resultado |
|--------|-----------|
| Prisma ↔ Migration `20260716070000_proprietarios_corretores` | Alinhados · deploy local OK |
| APIs `/proprietarios` ↔ telas | CRUD, soft delete, dashboard, bancário, anotações |
| APIs `/corretores` ↔ telas | CRUD, foto, equipes, ranking, indicadores |
| Integração Imóveis / Clientes / Agenda / Pipeline / Dashboard | OK |
| Multiempresa / ownership | OK |
| Backend `npm run check` | OK |
| Frontend `npm run build` | OK |
| Design System SUSSAI | Exclusivo |

### Correções na revisão

- Avatar de lista de corretores sem URL autenticada (iniciais)
- Upload de documentos no detalhe do proprietário via API de clientes (mesmo registro)
- Dashboard geral com contadores de proprietários e corretores
- `equipeId` normalizado como string no Select MUI

## Entregas

### Banco

- Enums: `StatusCorretor`, `TipoContaBancaria`, `AcaoHistoricoCorretor`
- `ClienteDadosBancarios` (contas PIX/banco do proprietário)
- `CorretorEquipe`, `CorretorHistorico`
- `Usuario` expandido: `fotoUrl`, `fotoArquivo`, `creci`, `crea`, `comissaoPadrao`, `metaMensal`, `statusCorretor`, `equipeId`, `permissoes`

### Modelo de domínio

| Conceito | Implementação |
|----------|----------------|
| Proprietário | `Cliente` com `tipo: PROPRIETARIO` (mantém `Imovel.proprietarioId` / contratos) |
| Corretor | `Usuario` com perfil comercial (CRECI/CREA, meta, comissão, status, equipe) |

### APIs principais — Proprietários

| Método | Rota | Função |
|--------|------|--------|
| GET | `/proprietarios/opcoes` | Corretores e enums |
| GET | `/proprietarios/dashboard` | Indicadores da carteira |
| GET/POST | `/proprietarios` | Lista (pesquisa/filtros/paginação) + criação |
| GET/PUT/DELETE | `/proprietarios/:id` | Detalhe, edição, soft delete |
| POST | `/proprietarios/:id/reativar` | Reativação |
| PUT | `/proprietarios/:id/dados-bancarios` | Sync de contas |
| POST | `/proprietarios/:id/anotacoes` | Anotações |
| POST/GET | `/clientes/:id/documentos*` | Upload/servir documentos (mesmo ID) |
| PUT | `/clientes/:id/contatos` | Contatos/endereços (mesmo ID) |

### APIs principais — Corretores

| Método | Rota | Função |
|--------|------|--------|
| GET | `/corretores/opcoes` | Equipes, status, tipos |
| GET | `/corretores/dashboard` | Visão gerencial |
| GET | `/corretores/ranking` | Ranking por vendas no mês |
| GET/POST | `/corretores/equipes` | Listar / criar equipe |
| GET/POST | `/corretores` | Lista + criação |
| GET/PUT | `/corretores/:id` | Detalhe (indicadores) + edição |
| POST/GET | `/corretores/:id/foto*` | Upload e servir foto |

### Indicadores por corretor

- Vendas no mês (contratos/fechamentos)
- Captações (imóveis sob corretagem)
- Conversão (pipeline)
- Meta mensal e progresso
- Comissão prevista
- Leads abertos e agenda do mês

### Frontend

- `/proprietarios` — lista, filtros, paginação, soft delete
- `/proprietarios/novo` · `/:id` · `/:id/editar` — PF/PJ, bancário, contatos
- Detalhe: dashboard, imóveis vinculados, documentos, anotações, histórico
- `/corretores` — lista, ranking, filtros, status
- `/corretores/novo` · `/:id` · `/:id/editar` — CRECI/CREA, comissão, meta, equipe, permissões
- Detalhe: indicadores, meta, pipeline, imóveis, agenda, histórico, foto
- Sidebar: **Proprietários** e **Corretores**
- Dashboard geral: cards e atalhos para os dois módulos

### Integrações

- **Imóveis** — proprietário e corretor nos vínculos e navegação
- **Clientes** — contatos/documentos reutilizados para o mesmo `Cliente` proprietário
- **Agenda** — compromissos no dashboard individual do corretor
- **Pipeline** — leads abertos e conversão nos indicadores
- **Dashboard** — `totalProprietarios` e `totalCorretores` no resumo

## Arquivos principais

- `backend/prisma/migrations/20260716070000_proprietarios_corretores/`
- `backend/src/controllers/proprietarioController.js`
- `backend/src/controllers/corretorController.js`
- `backend/src/routes/proprietarioRoutes.js`
- `backend/src/routes/corretorRoutes.js`
- `backend/src/controllers/dashboardController.js`
- `frontend/src/pages/Proprietarios.jsx` · `ProprietarioForm.jsx` · `ProprietarioDetalhes.jsx`
- `frontend/src/pages/Corretores.jsx` · `CorretorForm.jsx` · `CorretorDetalhes.jsx`
- `frontend/src/App.jsx` · `components/layout/Sidebar.jsx`
- `docs/SPRINT_6_REPORT.md`, `docs/TODO.md`, `CHANGELOG.md`

## Dependências novas

- Nenhuma (reuso de Multer, DS SUSSAI e Prisma)

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

1. Cadastrar proprietário PF e PJ com dados bancários  
2. Anexar documento e criar anotação no detalhe  
3. Vincular imóvel ao proprietário e conferir no dashboard  
4. Soft delete / reativar proprietário  
5. Cadastrar corretor com CRECI, meta, comissão e equipe  
6. Enviar foto e conferir ranking / indicadores  
7. Abrir detalhe do corretor: pipeline, agenda e imóveis  
8. Conferir cards no Dashboard geral  

## Limites conscientes

- Foto do corretor em disco local (não S3/R2)
- Permissões de corretor ainda como lista JSON (RBAC granular fica para hardening)
- Ranking baseado em indicadores do mês corrente
- `prisma generate` pode falhar com EPERM se `npm run dev` (backend) estiver com o engine DLL travado — o client já contém o schema da Sprint 6; reiniciar o server resolve regeneração

## Conclusão

Sprint 6 **implementada e validada**. Proprietários e Corretores estão integrados ao fluxo comercial da imobiliária.

**Não iniciar a Sprint 7 sem aprovação explícita.**
