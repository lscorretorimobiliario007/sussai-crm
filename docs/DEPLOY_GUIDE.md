# SUSSAI — Guia de Deploy (Go Live)

**Objetivo:** publicar Backend (API), Frontend (CRM), Site (Top Conceição) e Banco PostgreSQL para operação diária.  
**Não cria módulos novos** — apenas implantação da stack existente.

Checklist operacional: [GO_LIVE_CHECKLIST.md](./GO_LIVE_CHECKLIST.md)

---

## Arquitetura de publicação

```
                    ┌─────────────────────┐
   Usuários CRM ───►│ Frontend (Vite SPA) │
                    │ https://crm.…       │
                    └─────────┬───────────┘
                              │ HTTPS + JWT
                    ┌─────────▼───────────┐
   Site Next ──────►│ Backend API         │
   (SSR/forms)      │ https://api.…       │
                    └─────────┬───────────┘
                              │
                    ┌─────────▼───────────┐
                    │ PostgreSQL          │
                    │ + disco uploads/    │
                    └─────────────────────┘

   Visitantes ─────► Site Next.js https://www.…
```

| Componente | Pasta | Runtime |
|------------|-------|---------|
| API | `backend/` | Node.js 20+ |
| CRM | `frontend/` | Build estático (Nginx/CDN) ou preview Node |
| Site | `top-conceicao-site/` | Next.js 15 (`next start`) |
| Banco | — | PostgreSQL 16+ |

Requisitos locais de build: Node.js **≥ 20**, npm, acesso à `DATABASE_URL`.

---

## 1. Banco de dados

### 1.1 Criar instância

1. Provisionar PostgreSQL 16+ (managed preferível: RDS, Neon, Supabase, Railway, etc.).
2. Criar database, ex.: `sussai_crm`.
3. Criar usuário da aplicação com senha forte.
4. Liberar firewall/IP do servidor da API (ou VPC).
5. Exigir SSL quando o provedor oferecer.

### 1.2 Connection string

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/sussai_crm?sslmode=require"
```

### 1.3 Migrations

No servidor de build/deploy da API (com `DATABASE_URL` de produção):

```bash
cd backend
npm ci
npx prisma migrate deploy
npx prisma generate
```

Validar:

```bash
npx prisma validate
npm run check
```

### 1.4 Backup

- Habilitar backup automático do provedor (diário).
- Export manual de emergência:

```bash
pg_dump "$DATABASE_URL" -Fc -f sussai_$(date +%Y%m%d).dump
```

Restore (exemplo):

```bash
pg_restore -d "$DATABASE_URL" --clean --if-exists sussai_YYYYMMDD.dump
```

### 1.5 Uploads (arquivos)

Fotos/anexos ficam em disco (`UPLOAD_DIR`, padrão `backend/uploads`).

- Em produção use volume **persistente** (não efêmero do container sem mount).
- Inclua essa pasta no backup (rsync/snapshot).
- Não sirva o diretório cru sem autenticação das rotas já existentes.

---

## 2. Backend (API)

### 2.1 Variáveis de ambiente

Copie `backend/.env.example` e ajuste para produção:

```env
DATABASE_URL="postgresql://…?sslmode=require"
JWT_SECRET="<gere com: openssl rand -base64 48>"
PORT=3000
CORS_ORIGIN="https://crm.topconceicao.com.br,https://www.topconceicao.com.br"
UPLOAD_DIR="/var/sussai/uploads"
ALLOW_PUBLIC_SIGNUP="false"
SITE_EMPRESA_ID="<ID numérico da empresa Top Conceição>"
```

| Variável | Obrigatória | Notas |
|----------|-------------|-------|
| `DATABASE_URL` | Sim | Falha o boot se ausente |
| `JWT_SECRET` | Sim | Falha o boot se ausente |
| `PORT` | Não | Default `3000` |
| `CORS_ORIGIN` | Sim em prod | Lista separada por vírgula, HTTPS. Se omitida, a API aceita só `http://localhost:5173` (quebrará CRM/site em produção). |
| `UPLOAD_DIR` | Recomendado | Path absoluto persistente |
| `ALLOW_PUBLIC_SIGNUP` | Sim em prod | `false` |
| `SITE_EMPRESA_ID` | Sim para o site | Sem isso `/public/*` retorna 503 |

### 2.2 Build / start

```bash
cd backend
npm ci
npx prisma migrate deploy
npx prisma generate
npm run build
# NUNCA use: prisma db push | node src/server.js (Express legado)
NODE_ENV=production npm run start:prod
```

O runtime de produção é **NestJS** (`dist/src/main.js`). O arquivo `src/server.js` (Express) é legado e **não** deve ser iniciado.

### 2.3 Process manager (exemplo PM2)

```bash
npm i -g pm2
cd backend
npm run build
pm2 start ecosystem.config.cjs --env production
# ou: pm2 start dist/src/main.js --name sussai-api
pm2 save
pm2 startup
```

Ou systemd unit apontando para `node dist/src/main.js` com `WorkingDirectory` = `backend/` e `EnvironmentFile` = `.env`.

### 2.4 Reverse proxy (Nginx — exemplo)

```nginx
server {
  listen 443 ssl http2;
  server_name api.topconceicao.com.br;

  # ssl_certificate …;
  # ssl_certificate_key …;

  client_max_body_size 25m;

  # Uploads servidos pelo Nest em /uploads (prefixo global da API é /api)
  location /uploads/ {
    proxy_pass http://127.0.0.1:3000/uploads/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

### 2.5 Validação da API

```bash
curl -s https://api.topconceicao.com.br/api/health
curl -s "https://api.topconceicao.com.br/api/public/imoveis?limit=1"
curl -s -X POST https://api.topconceicao.com.br/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@topconceicao.com.br","senha":"Admin@123"}'
```

Esperado: health `healthy`, imóveis públicos 200, login 200 com `access_token`.

---

## 3. Frontend CRM

### 3.1 Variáveis

Arquivo `frontend/.env.production` (ou `.env` no CI):

```env
VITE_API_URL=https://api.topconceicao.com.br
```

> **Importante:** variáveis `VITE_*` são embutidas no build. Qualquer mudança exige **rebuild + redeploy**.

### 3.2 Build

```bash
cd frontend
npm ci
npm run lint
npm run build
```

Artefato: `frontend/dist/`.

### 3.3 Hospedagem estática (Nginx — exemplo)

```nginx
server {
  listen 443 ssl http2;
  server_name crm.topconceicao.com.br;

  root /var/www/sussai-crm/dist;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  # cache de assets hasheados
  location /assets/ {
    expires 30d;
    add_header Cache-Control "public, immutable";
  }
}
```

Plataformas alternativas: Cloudflare Pages, S3+CloudFront, Netlify — desde que o fallback SPA aponte para `index.html`.

### 3.4 Validação do CRM

- Abrir `https://crm…/login`
- Login ADMIN
- Listar imóveis, abrir detalhe, upload de foto
- Pipeline e Agenda carregam
- Network tab: requests para `VITE_API_URL` em HTTPS, sem CORS error

---

## 4. Site Top Conceição

### 4.1 Variáveis

`top-conceicao-site/.env.production` / painel do host:

```env
NEXT_PUBLIC_SITE_URL=https://www.topconceicao.com.br
# Must include /api (Nest global prefix) — without it, public/leads and listings 404.
NEXT_PUBLIC_SUSSAI_API_URL=https://api.topconceicao.com.br/api
SUSSAI_API_URL=https://api.topconceicao.com.br/api
NEXT_PUBLIC_WHATSAPP=5511XXXXXXXXX
NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY=
```

| Variável | Uso |
|----------|-----|
| `NEXT_PUBLIC_SITE_URL` | Canonical, OG, sitemap, robots |
| `NEXT_PUBLIC_SUSSAI_API_URL` | Fetch no browser (leads) — base com `/api` |
| `SUSSAI_API_URL` | Fetch SSR no servidor Next — base com `/api` |
| `NEXT_PUBLIC_WHATSAPP` | Botões wa.me |

CORS do backend **deve** incluir `NEXT_PUBLIC_SITE_URL`.

### 4.2 Build e start

```bash
cd top-conceicao-site
npm ci
npm run lint
npm run build
NODE_ENV=production npm start
```

Default do script: porta **3001**. Em produção atrás de proxy:

```bash
PORT=3001 npm start
# ou
npx next start -p 3001
```

### 4.3 PM2 (exemplo)

```bash
cd top-conceicao-site
pm2 start npm --name sussai-site -- start
```

### 4.4 Nginx (exemplo)

```nginx
server {
  listen 443 ssl http2;
  server_name www.topconceicao.com.br topconceicao.com.br;

  location / {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}
```

> O site usa SSR/`force-dynamic` em listagens: precisa de runtime Node (não é export estático puro).

### 4.5 Validação do site

- Home com imóveis do CRM
- `/imoveis/{slug}` com fotos da API pública
- Formulário → lead no Pipeline
- `/sitemap.xml`, `/robots.txt`
- Lighthouse básico (Performance / SEO) no mobile

---

## 5. Ordem recomendada de deploy

1. **Banco** — criar + `migrate deploy`  
2. **API** — env + start + health  
3. Descobrir `SITE_EMPRESA_ID` (login CRM staging ou SQL) e setar na API  
4. **CRM** — build com `VITE_API_URL` + publicar  
5. Criar usuários reais; publicar imóveis (`publicadoSite`)  
6. **Site** — build com URLs de produção + publicar  
7. Executar [GO_LIVE_CHECKLIST.md](./GO_LIVE_CHECKLIST.md) seção 20 (smoke)  

---

## 6. Obter o `SITE_EMPRESA_ID`

Após o primeiro ADMIN existir:

```sql
SELECT id, nome, ativo FROM "Empresa" ORDER BY id;
```

Ou via CRM (contexto do usuário logado / configurações).  
Coloque o ID da Top Conceição em `SITE_EMPRESA_ID` e **reinicie a API**.

---

## 7. SSL

Opções comuns:

- **Certbot** + Nginx (`certbot --nginx`)
- Certificado gerenciado do PaaS (Vercel, Railway, Render, Fly)
- Cloudflare proxy (laranja) com Full (strict)

Sempre: redirect 80 → 443; HSTS opcional após estabilizar.

---

## 8. Segurança pós-deploy

1. `ALLOW_PUBLIC_SIGNUP=false`  
2. Remover/desativar usuários demo  
3. Rotacionar `JWT_SECRET` só com plano de re-login de todos  
4. Restringir Swagger se a API for pública na internet  
5. Firewall: só 80/443 públicos; Postgres e `PORT` internos  
6. Revisar `CORS_ORIGIN` (sem `*`, sem localhost em prod)  

---

## 9. Logs e monitoramento

### Logs

- PM2: `pm2 logs sussai-api`  
- Nginx: `/var/log/nginx/access.log` / `error.log`  
- Rotação: `logrotate` ou retenção do PaaS  

### Monitoramento mínimo

| Check | URL | Intervalo |
|-------|-----|-----------|
| API | `GET https://api…/` | 1–5 min |
| CRM | `GET https://crm…/login` | 5 min |
| Site | `GET https://www…/` | 5 min |

Alerta para e-mail/WhatsApp do responsável técnico.

---

## 10. LGPD (implantação)

Não exige módulo novo, mas exige processo:

1. Publicar política de privacidade (página ou PDF linkado no site).  
2. Garantir texto nos formulários: dados usados para retorno comercial.  
3. Definir e-mail de solicitação LGPD (ex.: `privacidade@…`).  
4. Restringir acesso CRM; não exportar planilhas para canais inseguros.  
5. Incluir backups no mesmo controle de acesso.

---

## 11. Rollback

| Camada | Ação |
|--------|------|
| API | `pm2 reload` da versão anterior do código; manter `UPLOAD_DIR` |
| CRM | Republicar `dist/` do build anterior |
| Site | `pm2`/hosting: release anterior do Next |
| Banco | **Só** restore de dump se migration for incompatível — preferir migration forward |

Antes de migration arriscada: `pg_dump` completo.

Nunca rode `npm run seed:demo --reset` em produção.

---

## 12. Comandos úteis (resumo)

```bash
# Raiz — qualidade
npm run check
npm run build

# API
cd backend && npm ci && npx prisma migrate deploy && npm start

# CRM
cd frontend && npm ci && npm run build   # gera dist/

# Site
cd top-conceicao-site && npm ci && npm run build && npm start
```

---

## 13. Domínios e env — matriz de exemplo

| Item | Staging | Produção |
|------|---------|----------|
| API | `https://api-staging.…` | `https://api.topconceicao.com.br` |
| CRM | `https://crm-staging.…` | `https://crm.topconceicao.com.br` |
| Site | `https://site-staging.…` | `https://www.topconceicao.com.br` |
| Signup | `false` | `false` |
| JWT | secreto staging | secreto **diferente** |
| SITE_EMPRESA_ID | ID staging | ID produção |

---

## 14. Suporte pós go-live (72h)

- Monitorar uptime e disco de uploads  
- Revisar leads do site no Pipeline  
- Confirmar fotos carregando (API pública `/public/imoveis/:id/fotos/:fotoId`)  
- Canal rápido com a Top Conceição para ajustes de conteúdo (destaques, WhatsApp, textos)

---

**Documento vivo:** atualize domínios reais e IDs quando forem definidos.  
**Aprovação go-live:** usar assinatura em [GO_LIVE_CHECKLIST.md](./GO_LIVE_CHECKLIST.md).
