# SUSSAI CRM — TODO (funcionalidades restantes)

**Atualizado:** 16/Jul/2026  
**Concluído:** Sprint 1–6 · Auditoria MVP · Sprint 7 · Sprint 7 Demo · **Sprint R1 (Imóveis)**  
**Regra:** não implementar novos itens sem aprovação explícita.  
**Produto:** SUSSAI SaaS comercial para imobiliárias.  
**Trilha:** [ROAD_TO_V1.md](ROAD_TO_V1.md)  
**Demo:** [SPRINT_7_DEMO_REPORT.md](SPRINT_7_DEMO_REPORT.md) · `demo@sussai.com.br` / `123456`  
**Site Top Conceição:** [SITE_MASTER_PLAN.md](SITE_MASTER_PLAN.md) (documentação — sem código)

---

## Próximas sprints sugeridas (aguardam aprovação)

### Site Top Conceição

- [x] Sprint 1 — base Next.js + home + páginas mock ([SITE_SPRINT_1_REPORT.md](SITE_SPRINT_1_REPORT.md))
- [ ] API pública de imóveis + flags `publicadoSite` / `slug`
- [ ] Integração site ↔ CRM (listagem, detalhe, leads)

### Prioridade alta (CRM)

- [ ] Modernizar **Contratos** (ativação/encerramento, PDF, histórico) — DS SUSSAI
- [ ] Modernizar **Tarefas** e **Configurações** no Design System
- [ ] Modernizar tela **Registrar** no padrão do Login

### Hardening (Fase B)

- [ ] E-mail único por empresa (migration + UX de login)
- [ ] Enforcer de `permissoes` de corretor **ou** remoção até RBAC
- [ ] Sync Agenda ↔ ClienteVisita (concluir/cancelar)
- [ ] Pipeline: etapa como fonte única de status
- [ ] Agregar ranking de corretores sem N+1
- [ ] Soft delete em tarefas
- [ ] Helmet/CSP + rate limit distribuído
- [ ] Conciliação com importação OFX (pós-v1)

### Módulos ainda inexistentes

- [ ] **Relatórios** gerenciais consolidados (além do financeiro)
- [ ] **Assistente IA**

### Integrações

- [ ] Upload S3/R2
- [ ] Thumbnails (Sharp)
- [ ] Google Maps
- [ ] WhatsApp Business API
- [ ] E-mail transacional
- [ ] Sync Agenda (Google/Outlook)
- [ ] Automações de pipeline
- [ ] Gateway de pagamento / boletos

### Fundação técnica

- [ ] TypeScript
- [ ] Testes automatizados (isolation multi-tenant)
- [ ] Logger estruturado
- [ ] Swagger/OpenAPI
- [ ] Docker Compose / CI/CD
- [ ] Code-split FullCalendar / Kanban / Financeiro

### SaaS comercial

- [ ] Billing / planos (Asaas)
- [ ] Limites por plano
- [ ] Landing + onboarding
- [ ] Super-admin
- [ ] LGPD

---

## Explicitamente fora do ciclo atual

- Não iniciar Sprint 8 sem aprovação
- Não priorizar stack/migração sem decisão de fase
