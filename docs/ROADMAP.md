# Roadmap SUSSAI CRM

## Fase 0 — Definição ✅

- [x] Visão do produto e posicionamento
- [x] Stack tecnológica definida
- [x] Módulos mapeados
- [x] Arquitetura documentada
- [x] Rebranding para SUSSAI CRM

---

## Sprint 1 — Segurança e Experiência ✅

- [x] Corrigir vulnerabilidades críticas de `empresaId` e IDOR
- [x] Remover mass assignment dos controllers
- [x] Aplicar ownership para corretores
- [x] Criar Design System oficial
- [x] Criar 12 componentes reutilizáveis
- [x] Implementar tema claro e escuro
- [x] Refatorar layout responsivo
- [x] Modernizar Dashboard e Login

Detalhes em [SPRINT_1_REPORT.md](SPRINT_1_REPORT.md).

---

## Sprint 2 — Módulo de Imóveis ✅

- [x] Cadastro, edição, exclusão e visualização de imóveis
- [x] Pesquisa instantânea e filtros avançados
- [x] Paginação e ordenação
- [x] Upload múltiplo de fotos com galeria
- [x] Tipos, finalidade, status, proprietário e corretor
- [x] Endereço completo, valores, áreas e características
- [x] Histórico de alterações paginado
- [x] Reordenação de fotos e reativação de inativos

Detalhes em [SPRINT_2_REPORT.md](SPRINT_2_REPORT.md).

---

## Fase 1 — Fundação Arquitetural

**Objetivo:** Base sólida para escalar sem retrabalho.

### Backend
- [ ] Migração JavaScript → TypeScript
- [ ] Estrutura Clean Architecture (pastas domain/application/infrastructure/presentation)
- [ ] Repository Pattern para todos os módulos existentes
- [ ] Service Layer com regras de negócio
- [ ] Validação Zod em todos os endpoints
- [ ] Error handling centralizado (`AppError` + middleware)
- [ ] Logger estruturado (Winston)
- [ ] Swagger/OpenAPI documentação

### Frontend
- [ ] Migração JavaScript → TypeScript
- [ ] Estrutura feature-based
- [x] Tema claro + escuro com toggle
- [x] Componentes base reutilizáveis (Button, Input, Select, Modal, Card, DataTable, Loading, EmptyState, ConfirmDialog, Toast)
- [ ] Lazy loading de rotas
- [x] Skeleton loading e animações de transição

### Infraestrutura
- [ ] Docker Compose (postgres + backend + frontend)
- [x] `.env.example` atualizado para execução local
- [ ] GitHub Actions CI (lint + build + test)

### Branding
- [x] SUSSAI CRM em toda a interface principal
- [x] Identidade visual inicial

**Entrega:** Sistema rodando em Docker, 100% TypeScript, arquitetura limpa.

---

## Fase 2 — Módulos Core Completos

**Objetivo:** Todos os módulos MVP funcionais e polidos.

- [ ] Dashboard moderno com gráficos Recharts
- [x] Imóveis com galeria de fotos
- [ ] Proprietários (módulo dedicado)
- [ ] Corretores (gestão de equipe)
- [ ] Agenda (calendário FullCalendar)
- [ ] CRM pipeline kanban completo
- [ ] Comissões (cálculo automático por contrato)
- [ ] Relatórios (PDF/Excel export)
- [ ] RBAC completo com permissões granulares

**Entrega:** CRM funcional completo para operação de uma imobiliária.

---

## Fase 3 — Integrações e Mídia

**Objetivo:** Diferenciais competitivos de produto.

- [ ] Upload de fotos (Multer + storage)
- [ ] Upload de vídeos
- [ ] Upload de PDF (contratos, documentos)
- [ ] Google Maps (geolocalização de imóveis)
- [ ] WhatsApp Business API (notificações e atendimento)
- [ ] Email transacional (boas-vindas, cobranças)

**Entrega:** Imobiliária opera 100% dentro do SUSSAI.

---

## Fase 4 — Inteligência Artificial

**Objetivo:** Diferencial de mercado com IA nativa.

- [ ] Assistente IA para corretores (descrição de imóveis, respostas a leads)
- [ ] Scoring de leads (probabilidade de conversão)
- [ ] Sugestão automática de imóveis para clientes
- [ ] Análise preditiva de inadimplência
- [ ] Resumo automático de reuniões e visitas

**Entrega:** SUSSAI como "CRM inteligente" — posicionamento único.

---

## Fase 5 — SaaS Comercial

**Objetivo:** Produto pronto para venda por assinatura.

- [ ] Billing e assinaturas (Asaas/Stripe)
- [ ] Limites por plano enforced no backend
- [ ] Onboarding guiado para novas imobiliárias
- [ ] Landing page comercial
- [ ] Painel super-admin (gestão de tenants)
- [ ] Monitoramento e alertas (Sentry, uptime)
- [ ] Backup automatizado do banco
- [ ] LGPD — termos, privacidade, exportação de dados

**Entrega:** SUSSAI CRM comercialmente disponível.

---

## Fase 6 — Escala e Ecossistema

**Objetivo:** Milhares de imobiliárias simultâneas.

- [ ] Integração com portais (Zap Imóveis, Viva Real, OLX)
- [ ] API pública para parceiros
- [ ] App mobile (React Native)
- [ ] Marketplace de integrações
- [ ] White-label para redes de franquias
- [ ] Multi-região (latência otimizada)

**Entrega:** Líder de mercado CRM imobiliário no Brasil.
