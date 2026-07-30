# SUSSAI CRM

**Sistema Inteligente para Imobiliárias**

> O CRM imobiliário mais moderno do Brasil.

---

## Visão

Criar um SaaS comercial de referência no mercado imobiliário brasileiro, com experiência superior aos concorrentes e arquitetura preparada para escalar para milhares de imobiliárias simultâneas.

## Posicionamento Competitivo

| Concorrente | Foco | Diferencial SUSSAI |
|-------------|------|-------------------|
| Kenlo | Gestão imobiliária tradicional | UX moderna, IA nativa, performance |
| Jetimob | CRM + portais | Interface premium, automações inteligentes |
| Vista CRM | Pipeline de vendas | Dashboard analítico em tempo real |
| Superlógica | Financeiro + condomínios | CRM unificado com financeiro integrado |
| Salesforce | CRM genérico | Especialização imobiliária nativa |
| HubSpot | Marketing + CRM | Foco 100% no mercado imobiliário BR |

### Pilares de diferenciação

1. **Visual premium** — interface moderna, animações suaves, tema claro/escuro
2. **Performance extrema** — carregamento rápido, otimização em cada camada
3. **Inteligência artificial** — assistente, automações e insights preditivos
4. **Experiência mobile-first** — responsivo em todos os dispositivos
5. **Integrações nativas** — WhatsApp, Google Maps, portais imobiliários

---

## Stack Tecnológica (Obrigatória)

### Frontend

| Tecnologia | Uso |
|------------|-----|
| React 18+ | Framework UI |
| TypeScript | Tipagem estática |
| Vite | Build e dev server |
| Material UI | Design system |
| React Router | Navegação SPA |
| Axios | Cliente HTTP |

### Backend

| Tecnologia | Uso |
|------------|-----|
| Node.js | Runtime |
| Express | Framework HTTP |
| Prisma ORM | Acesso a dados |
| PostgreSQL | Banco relacional |
| JWT | Autenticação |
| Multer | Upload de arquivos |

### Infraestrutura

| Tecnologia | Uso |
|------------|-----|
| Docker | Containerização |
| Swagger | Documentação da API |
| GitHub | Versionamento e CI/CD |

---

## Módulos do Sistema

### Core (MVP Comercial)

| Módulo | Descrição | Status |
|--------|-----------|--------|
| **Dashboard** | KPIs, gráficos, visão geral do negócio | ✅ Base existente |
| **Imóveis** | Cadastro, filtros, galeria, status | ✅ Base existente |
| **Clientes** | Compradores, inquilinos, leads | ✅ Base existente |
| **Proprietários** | Gestão dedicada de proprietários | 🔲 A extrair de Clientes |
| **Corretores** | Gestão da equipe comercial | 🔲 A extrair de Usuários |
| **Agenda** | Calendário, visitas, compromissos | 🔲 Novo |
| **CRM** | Pipeline kanban, funil de vendas | ⚠️ Parcial (Leads) |
| **Financeiro** | Cobranças, pagamentos, inadimplência | ✅ Base existente |
| **Comissões** | Cálculo e gestão de comissões | 🔲 Novo |
| **Contratos** | Aluguel, venda, administração | ✅ Base existente |
| **Relatórios** | Exportação, análises, dashboards | 🔲 Novo |

### Integrações

| Módulo | Descrição | Status |
|--------|-----------|--------|
| **Google Maps** | Geolocalização de imóveis | 🔲 Novo |
| **Upload de Fotos** | Galeria de imagens dos imóveis | 🔲 Novo |
| **Upload de Vídeos** | Tours virtuais | 🔲 Novo |
| **Upload de PDF** | Documentos e contratos | 🔲 Novo |
| **WhatsApp** | Comunicação com clientes | 🔲 Novo |
| **IA** | Assistente, automações, insights | 🔲 Novo |

### Plataforma

| Recurso | Descrição | Status |
|---------|-----------|--------|
| **Multiempresa** | Isolamento total por imobiliária (tenant) | ✅ Implementado |
| **Controle de Permissões** | RBAC por perfil | ⚠️ Parcial |
| **Administrador** | Acesso total à imobiliária | ✅ Implementado |
| **Gestor** | Gestão de equipe e relatórios | ✅ Implementado |
| **Corretor** | Operação comercial limitada | ✅ Implementado |

---

## Perfis de Usuário (RBAC)

```
ADMINISTRADOR
├── Configurações da empresa
├── Gestão de usuários e permissões
├── Planos e billing
└── Acesso total a todos os módulos

GERENTE
├── Relatórios e dashboards
├── Gestão de corretores
├── Aprovação de contratos
└── Visão financeira completa

CORRETOR
├── Imóveis (próprios e compartilhados)
├── Clientes e leads (próprios)
├── Agenda pessoal
└── Comissões (próprias)
```

---

## Experiência do Usuário (UX)

### Visual

- Tema **claro** e **escuro** com toggle persistente
- Design **premium** — tipografia Inter, paleta profissional, espaçamento generoso
- **Animações suaves** — transições de página, micro-interações, skeleton loading
- **Responsivo** — desktop, tablet e mobile

### Performance

- Lazy loading de rotas e componentes
- Paginação server-side em todas as listagens
- Cache inteligente no frontend
- Queries otimizadas com índices no PostgreSQL
- Upload assíncrono com progress bar
- CDN para assets estáticos e mídia

### Padrões de UI

- DataTable reutilizável com filtros, ordenação e paginação
- FormModal padronizado para CRUD
- StatusChip para estados visuais
- EmptyState para listas vazias
- ConfirmDialog para ações destrutivas
- Toast notifications para feedback

---

## Modelo Comercial (SaaS)

### Planos

| Plano | Imóveis | Usuários | Preço sugerido |
|-------|---------|----------|----------------|
| **Starter** | 50 | 3 | R$ 97/mês |
| **Professional** | 500 | 15 | R$ 297/mês |
| **Enterprise** | Ilimitado | Ilimitado | Sob consulta |

### Regras de negócio por plano

- Limites enforced no backend (nunca só no frontend)
- Upgrade/downgrade com migração de dados
- Trial de 14 dias no plano Professional
- Billing via gateway de pagamento (Asaas ou Stripe)

---

## Critérios de Qualidade

Todo código entregue deve atender:

- [ ] TypeScript sem `any` desnecessário
- [ ] Clean Architecture (Controller → Service → Repository)
- [ ] Validação de entrada com Zod
- [ ] Testes unitários nos services
- [ ] Tenant isolation em toda query
- [ ] Tratamento de erros centralizado
- [ ] Documentação Swagger para cada endpoint
- [ ] Componentes reutilizáveis no frontend
- [ ] Acessibilidade WCAG 2.1 nível AA
- [ ] Performance: LCP < 2.5s, API < 200ms p95

---

## Legenda de Status

| Símbolo | Significado |
|---------|-------------|
| ✅ | Implementado no código atual |
| ⚠️ | Parcial — precisa evoluir |
| 🔲 | Planejado — não existe no código |

> Baseline verificado em [AUDITORIA.md](AUDITORIA.md).
