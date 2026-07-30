# SUSSAI CRM — Road to v1

**Atualizado:** 16/Jul/2026  
**Estado atual:** MVP estabilizado (Sprints 1–6 + auditoria)  
**Meta v1:** produto comercial confiável para imobiliárias pagantes

> Não iniciar Sprint 7 ou módulos novos sem aprovação explícita.

---

## Princípios

1. **Estabilidade antes de feature** — fechar dívidas do MVP antes de Comissões/IA/Billing.
2. **Um produto, um Design System** — eliminar UI legado.
3. **Segurança SaaS** — multi-tenant + auth abuse + signup controlado.
4. **Mensurável** — cada fase tem critério de saída.

---

## Fase A — Freeze do piloto (agora)

**Objetivo:** operação controlada com clientes internos / early adopters.

| Entrega | Critério de saída |
|---------|-------------------|
| Checklist MVP 100% seções 1–8 e 10 | [MVP_CHECKLIST.md](MVP_CHECKLIST.md) |
| `ALLOW_PUBLIC_SIGNUP=false` em staging/prod | Sem tenants spam |
| Backup DB + restore testado | RPO definido |
| Monitoramento básico (uptime + erros 5xx) | Alertas |

**Não fazer nesta fase:** módulos novos, migração TypeScript, redesign amplo.

---

## Fase B — Hardening (pré-v1)

**Objetivo:** fechar riscos listados na auditoria sem expandir escopo de produto.

### B1 · Segurança
- Rate limit Redis (multi-instância)
- Helmet + CSP API
- Magic-byte validation em todos os uploads de imagem
- Decisão: e-mail único por empresa vs global + login com slug
- Decisão: invite-only signup
- JWT access curto + refresh (ou sessão HttpOnly)

### B2 · Dados / APIs
- Eliminar N+1 do ranking de corretores (aggregates)
- Soft delete em tarefas (alinhar política)
- Sync Agenda ↔ `ClienteVisita` no concluir/cancelar
- Etapa do pipeline como única fonte de verdade (deprecar `status` solto)
- Enforcer de `permissoes` **ou** remover do UI até RBAC real

### B3 · Qualidade
- Testes de isolation multi-tenant (smoke automatizado)
- Testes de auth (login, rate limit, ownership CORRETOR)
- Logger estruturado + request id
- Zod (ou similar) nos endpoints críticos

**Saída:** zero achados CRITICAL/HIGH abertos na auditoria.

---

## Fase C — Paridade de experiência (candidato Sprint 7+)

**Objetivo:** Contratos, Financeiro, Tarefas e Configurações no Design System SUSSAI.

Ordem sugerida (aprovação necessária):

1. **Contratos** — ativação/encerramento, PDF, histórico, select de proprietário, busca
2. **Financeiro** — UI premium, filtros, paginação visual, confirmação de pagamento
3. **Tarefas** — DS + confirmação de exclusão + soft delete
4. **Configurações / Registrar** — alinhados ao Login

**Saída:** sidebar inteira no mesmo padrão visual dos módulos Sprint 2–6.

---

## Fase D — Produto comercial v1

**Objetivo:** monetizar e escalar.

| Bloco | Itens |
|-------|-------|
| Billing | Planos, limites, Asaas (ou similar) |
| Comissões | Apuração a partir de corretores/contratos |
| Relatórios | PDF/Excel gerenciais |
| Infra | Docker Compose, CI/CD, S3/R2 uploads |
| Ops | Swagger, healthchecks, backups automatizados |
| LGPD | Export/erase, consentimentos, auditoria de acesso |

**Fora do v1 (v1.x / v2):** Assistente IA, WhatsApp Business API, Google Maps nativo, sync Google/Outlook, scoring por IA.

---

## Critérios de “v1 lançável”

- [ ] Multiempresa sem vazamento em testes automatizados
- [ ] Signup controlado + billing mínimo
- [ ] Todos os módulos do sidebar no DS SUSSAI
- [ ] Uploads em object storage (não só disco)
- [ ] Observabilidade (logs + erros + uptime)
- [ ] Documentação operacional (runbook) atualizada
- [ ] Checklist MVP + hardening 100%

---

## Mapa de risco residual (pós-auditoria)

| Risco | Impacto | Mitigação planejada | Fase |
|-------|---------|---------------------|------|
| Signup aberto em prod | Alto | `ALLOW_PUBLIC_SIGNUP=false` | A |
| E-mail global único | Médio | `@@unique([empresaId, email])` | B |
| UI legado | Médio | Sprint Contratos/Financeiro | C |
| `permissoes` cosméticas | Médio | Enforcer ou remoção | B |
| Disco local uploads | Alto em escala | S3/R2 | D |
| Sem testes | Alto | Suite isolation | B |

---

## Próxima decisão necessária

Escolher **uma** trilha após o piloto:

1. **Hardening (Fase B)** — recomendado se for produção real em breve  
2. **Paridade DS (Fase C / Sprint 7)** — se a dor principal for UX dos módulos legados  
3. **Billing (Fase D parcial)** — só se já houver clientes pagando

Qualquer escolha exige **aprovação explícita**. Até lá, o MVP permanece em freeze de features.
