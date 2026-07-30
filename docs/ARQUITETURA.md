# Arquitetura SUSSAI CRM

## Visão Geral

Monorepo com frontend e backend desacoplados, comunicação via REST API, multi-tenant por `empresaId`.

```
sistema-imobiliaria/
├── backend/                 # API Node.js + Express + Prisma
├── frontend/                # SPA React + TypeScript + Vite
├── docs/                    # Documentação do projeto
├── docker-compose.yml       # Ambiente local containerizado
└── README.md
```

---

## Arquitetura Backend (Clean Architecture)

```
backend/src/
├── config/                  # Variáveis de ambiente, Prisma client
├── domain/                  # Entidades e regras de negócio puras
│   ├── entities/
│   └── enums/
├── application/             # Casos de uso e serviços
│   ├── services/
│   └── dtos/
├── infrastructure/          # Implementações concretas
│   ├── repositories/
│   ├── storage/             # Upload S3/local
│   └── messaging/           # WhatsApp, email
├── presentation/            # Camada HTTP
│   ├── controllers/
│   ├── routes/
│   ├── middlewares/
│   └── validators/
├── shared/                  # Utilitários cross-cutting
│   ├── errors/
│   ├── logger/
│   └── helpers/
├── app.ts
└── server.ts
```

### Fluxo de uma requisição

```
Request
  → Middleware (auth, tenant, rate-limit)
  → Route
  → Controller (HTTP only)
  → Service (business logic)
  → Repository (data access)
  → Prisma → PostgreSQL
  → Response (DTO padronizado)
```

### Regras

1. Controllers **nunca** acessam Prisma diretamente
2. Services **nunca** conhecem `req`/`res`
3. Repositories **sempre** filtram por `empresaId`
4. DTOs validados com Zod antes de entrar no service
5. Erros lançados como classes (`AppError`, `NotFoundError`, etc.)

---

## Arquitetura Frontend

```
frontend/src/
├── app/                     # Providers, rotas, tema
│   ├── App.tsx
│   ├── routes.tsx
│   └── providers/
├── features/                # Módulos por domínio (feature-based)
│   ├── auth/
│   ├── dashboard/
│   ├── imoveis/
│   ├── clientes/
│   ├── crm/
│   ├── financeiro/
│   └── ...
├── shared/                  # Código reutilizável
│   ├── components/          # UI genérica (DataTable, Modal, etc.)
│   ├── hooks/
│   ├── services/            # API clients
│   ├── types/
│   ├── utils/
│   └── constants/
├── assets/
└── main.tsx
```

### Padrões Frontend

- **Feature-based structure** — cada módulo é autocontido
- **Custom hooks** para lógica de estado (`useImoveis`, `useAuth`)
- **Service layer** — Axios encapsulado por domínio
- **Theme provider** — claro/escuro via Context + MUI
- **Lazy routes** — code splitting por módulo

---

## Banco de Dados (PostgreSQL + Prisma)

### Multi-tenancy

Toda tabela de negócio possui `empresaId`. Isolamento garantido em:

- Middleware de autenticação (injeta `empresaId` no contexto)
- Repository base (filtra automaticamente)
- Índices compostos `(empresaId, campo)` para performance

### Entidades principais

```
Empresa (tenant)
├── Usuario (ADMIN | GERENTE | CORRETOR)
├── Imovel
├── Cliente (COMPRADOR | INQUILINO | LEAD)
├── Proprietario (extraído ou vinculado a Cliente)
├── Lead (pipeline CRM)
├── Contrato
├── Cobranca
├── Comissao
├── Tarefa / EventoAgenda
├── Arquivo (fotos, vídeos, PDFs)
└── LogAuditoria
```

---

## Autenticação e Autorização

```
JWT Payload:
{
  sub: usuarioId,
  empresaId: tenantId,
  role: "ADMIN" | "GERENTE" | "CORRETOR",
  iat, exp
}
```

### Middleware chain

1. `authMiddleware` — valida JWT
2. `tenantMiddleware` — injeta `empresaId` no request
3. `roleMiddleware(['ADMIN', 'GERENTE'])` — RBAC por rota

---

## API REST

### Convenções

| Método | Rota | Ação |
|--------|------|------|
| GET | `/api/v1/imoveis` | Listar (paginado) |
| GET | `/api/v1/imoveis/:id` | Detalhe |
| POST | `/api/v1/imoveis` | Criar |
| PUT | `/api/v1/imoveis/:id` | Atualizar |
| DELETE | `/api/v1/imoveis/:id` | Remover (soft delete) |

### Response padrão

```json
{
  "success": true,
  "data": {},
  "meta": { "page": 1, "total": 100, "perPage": 20 }
}
```

### Error padrão

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Campo obrigatório",
    "details": []
  }
}
```

Documentação completa via **Swagger** em `/api/docs`.

---

## Upload de Arquivos

```
Multer → validação (tipo, tamanho)
  → Storage Service (local dev / S3 prod)
  → registro em tabela Arquivo
  → URL assinada para acesso
```

| Tipo | Extensões | Tamanho máx. |
|------|-----------|--------------|
| Foto | jpg, png, webp | 10 MB |
| Vídeo | mp4, webm | 100 MB |
| PDF | pdf | 25 MB |

---

## Docker

```yaml
services:
  postgres:    # PostgreSQL 16
  backend:     # API Node.js
  frontend:    # Nginx servindo build Vite
```

Ambientes: `development`, `staging`, `production`.

---

## Observabilidade

| Camada | Ferramenta |
|--------|------------|
| Logs | Winston (estruturado JSON) |
| Métricas | Prometheus + Grafana (futuro) |
| Erros | Sentry (futuro) |
| APM | Datadog (futuro) |

---

## Segurança

- HTTPS obrigatório em produção
- CORS restrito por ambiente
- Rate limiting por IP e por tenant
- Bcrypt (cost 12) para senhas
- Sanitização de inputs
- Audit log para ações sensíveis
- Secrets via variáveis de ambiente (nunca no código)
