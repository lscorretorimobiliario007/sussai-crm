# Changelog

Todas as mudanças relevantes do SUSSAI CRM são documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e o projeto adota versionamento semântico quando aplicável.

## [Unreleased]

### Added

- **V1 Imóveis — Refinamento final**
  - Captação: origem, situação, captador, próximo contato, última atualização
  - Detalhe com proprietário (nome, WhatsApp, telefone, e-mail) sem abrir outra tela
  - Histórico completo de chaves (`ImovelChaveHistorico`) com registro automático
  - Painel de publicação (site, destaque, alto padrão, comercial, lançamento, oculto, revisão)
  - Timeline com eventos de preço, proprietário, publicação e chaves
  - Migration `20260716230000_v1_imoveis_refinamento_final`
  - Relatório: `docs/V1_IMOVEIS_REFINAMENTO_FINAL.md`

- **V1.0 Imóveis — Operação real**
  - Cadastro em abas (principais, localização, documentação, comercial, características, SEO/mídia, galeria)
  - CEP ViaCEP, Google Maps, angariador, captação, FGTS/veículo/proposta, chave digital, SEO e planta
  - Galeria com drag-and-drop e foto principal
  - Migration `20260716220000_v1_imoveis_operacao`
  - Relatório: `docs/V1_IMOVEIS_REPORT.md`

- **Implantação Top Conceição — Configurações da Empresa**
  - Perfil completo da empresa (marca, contato, endereço, redes, Maps, SEO, flags do site)
  - API `/empresa` + assets públicos `/public/empresa`
  - CRM Configurações alimenta site (header, rodapé, contato, metadados)
  - Migration `20260716210000_empresa_implantacao`
  - Relatório: `docs/IMPLANTACAO_EMPRESA_REPORT.md`

- **Go Live**
  - Checklist de implantação operacional: `docs/GO_LIVE_CHECKLIST.md`
  - Guia de publicação (API, CRM, Site, Banco, SSL, backup, LGPD, rollback): `docs/DEPLOY_GUIDE.md`
  - Sem novos módulos — documentação de operação para Top Conceição Imóveis

- **Release Candidate 1 (RC1)**
  - Gates na raiz: `npm run check` e `npm run build` (backend + frontend + site)
  - Swagger/OpenAPI em `/api/docs` e `/api/docs/openapi.json`
  - Índices de performance multiempresa (`20260716200000_rc1_indexes`)
  - UX alinhada em Tarefas, Contratos, Configurações e Registrar (toast, skeleton, empty, confirmações, DS)
  - Site: `loading.tsx`, imagens AVIF/WebP, compressão e porta 3001
  - README atualizado para estado RC1
  - Relatório: `docs/RC1_REPORT.md`

- **Site Top Conceição — Sprint 2**
  - Integração do portal com API pública SUSSAI (`/public/imoveis`, `/public/corretores`, `/public/leads`) — sem novo módulo CRM
  - Campos de publicação no imóvel (`publicadoSite`, `destaqueSite`, `lancamento`, `altoPadrao`, `slug`, mídia/mapa)
  - Remoção total de mocks de imóveis/corretores; listagens e detalhe consomem o CRM
  - Home premium: header animado, hero, busca avançada, seções (destaque, lançamentos, alto padrão, comerciais, avalie, corretores, depoimentos, blog) e rodapé completo
  - Página do imóvel: galeria/lightbox, mapa, simulador, WhatsApp, visita, lead e semelhantes
  - SEO reforçado (OG, sitemap dinâmico, robots, JSON-LD, URLs por slug)
  - Lead do site → Cliente + Pipeline + Agenda (visita opcional)
  - Relatório: `docs/SITE_SPRINT_2_REPORT.md`

- **Site Top Conceição — Sprint 1**
  - Novo projeto `top-conceicao-site` (Next.js 15 + React 19 + MUI 6 + TypeScript)
  - Home premium funcional com hero, busca inteligente, cards e seções
  - Páginas: Comprar, Alugar, Lançamentos, Alto Padrão, Comercial, Busca, Detalhe, Avalie, Sobre, Corretores, Blog, Contato
  - SEO (metadata, sitemap, robots, JSON-LD) com dados mockados
  - Relatório: `docs/SITE_SPRINT_1_REPORT.md`

- **Sprint R1 — Refinamento de Imóveis**
  - Controle de chaves (local, código, retirada, devolução)
  - Exclusividade, aceita financiamento/permuta, ocupação, observações internas
  - Formulário reorganizado em seções
  - 16 filtros canônicos de comodidades (CRM + preparação para o site)
  - Filtros comerciais na listagem; `GET /imoveis/opcoes` com `filtrosSite`
  - Migration `20260716180000_imoveis_refinamento_r1`
  - Relatório: `docs/SPRINT_R1_REPORT.md`
  - Arquitetura do site Top Conceição (docs only): `docs/SITE_MASTER_PLAN.md`

- **Sprint 7 Demo — Preparação comercial**
  - Usuário DEMO `demo@sussai.com.br` / `123456` com empresa e seed fictício completo
  - APIs `POST /auth/demo` e `POST /auth/demo/reset` + script `npm run seed:demo`
  - Botão **Modo Demonstração** no Login e chip de reinício na Navbar
  - Tour guiado para novos usuários (`GuidedTour`)
  - Dashboard executivo com hero demo, cards premium, gráficos e skeleton loading
  - Polish de empty states, animações (`sussaiFadeUp`) e consistência visual do DS
  - Relatório: `docs/SPRINT_7_DEMO_REPORT.md`

- **Sprint 7 — Financeiro completo**
  - Contas a receber e a pagar (`LancamentoFinanceiro`)
  - Cobranças com sync para lançamentos e geração mensal por contrato
  - Comissões (prevista/aprovada/paga) com geração a partir de contratos
  - Centros de custo e categorias financeiras (seed padrão por empresa)
  - Fluxo de caixa, caixa diário, conciliação e DRE simplificado
  - Dashboard financeiro com indicadores e série mensal
  - Pesquisa, filtros, paginação e exportação PDF/Excel
  - Integração com Contratos, Clientes, Corretores e Dashboard geral
  - UI exclusiva no Design System SUSSAI (`/financeiro` com abas)

- **Estabilização MVP — Auditoria técnica**
  - Documentos: `docs/MVP_AUDITORIA.md`, `docs/MVP_CHECKLIST.md`, `docs/ROAD_TO_V1.md`
  - Rate limit em login/registro; gate `ALLOW_PUBLIC_SIGNUP`
  - Índices em Contrato, Cobrança e Tarefa (`20260716120000_mvp_indexes`)
  - Access middleware antes do upload de anexos de lead

- **Sprint 6 — Proprietários e Corretores**
  - Cadastro completo de proprietários (PF/PJ), endereços, contatos, documentos, dados bancários, histórico e anotações
  - Soft delete / reativação, imóveis vinculados e dashboard do proprietário
  - Cadastro de corretores com foto, CRECI/CREA, comissão padrão, meta mensal, equipe, permissões e status (Ativo/Inativo/Férias)
  - Ranking, indicadores (vendas, captações, conversão, meta, comissão prevista) e dashboard individual
  - Integração com Imóveis, Clientes, Agenda, Pipeline CRM e Dashboard geral
  - Design System SUSSAI nos módulos `/proprietarios` e `/corretores`

- **Sprint 5 — Pipeline Comercial (CRM)**
  - Kanban com drag-and-drop (`@dnd-kit`)
  - Etapas personalizáveis por empresa (`PipelineEtapa`)
  - Oportunidades com probabilidade, valor previsto, previsão de fechamento e motivo da perda
  - Timeline, comentários, anexos, tarefas e agenda vinculadas ao lead
  - Dashboard comercial com funil de conversão e indicadores
  - Integração com Clientes, Imóveis, Agenda e Dashboard geral
  - Design System SUSSAI no módulo `/leads`

### Fixed

- **RC1:** import morto em Corretores; removido `Header.jsx` morto; writes financeiros de categoria/centro escopados por `empresaId`; alt nas miniaturas da galeria do site; Tarefas sem `alert`/`console.error`
- Seed demo alinhado ao schema (`areaUtil`, equipe sem `descricao`)
- Ícones MUI inválidos no Login/Navbar (`PlayCircleOutlined`)
- Escalação GERENTE → ADMIN no update de corretor
- Avatar de clientes na lista (AuthenticatedImage)
- Vazamento de memória no cache de imagens autenticadas (LRU + revoke)
- Contadores do dashboard e opções de imóvel respeitam ownership do CORRETOR
- `/clientes` deixa de misturar proprietários; create bloqueia `tipo: PROPRIETARIO`
- Listas de contratos/tarefas/cobranças paginadas; pipeline com teto
- Soft delete de cliente limpa token de compartilhamento
- Contatos de proprietário sincronizados também no create
- Tabelas legadas com scroll horizontal; erros tratados em Tarefas/Financeiro

## [0.5.0] — 2026-07-16

### Added

- **Sprint 4 — Agenda**
  - Calendários mês/semana/dia + lista (FullCalendar)
  - Drag-and-drop para reagendar, repetição, lembretes e notificações
  - Visitas, reuniões, ligações e tarefas
  - Integração com clientes, imóveis e corretores

- **Sprint 3 — Clientes**
  - Cadastro PF/PJ completo, contatos múltiplos, documentos, avatar
  - Favoritos, visitas, propostas, exportação PDF/Excel
  - Soft delete, histórico, anotações e timeline

- **Sprint 2 — Imóveis**
  - Portfólio completo com fotos, filtros, paginação e histórico
  - Soft delete / reativação e ownership por corretor

- **Sprint 1 — Fundação**
  - Segurança multiempresa, mass assignment e RBAC básico
  - Design System SUSSAI, tema claro/escuro, Login e Dashboard premium

### Changed

- Sidebar: “Pipeline de Vendas” → **Pipeline CRM**
- Dashboard: leads recentes exibem etapa do funil
- Lista de leads passa a retornar `{ data, meta, etapas }`

### Security

- Ownership de leads por `empresaId` + `corretorId` (CORRETOR)
- Arquivos de anexos de lead servidos autenticados
