# SUSSAI — Go Live Checklist

**Cliente:** Top Conceição Imóveis  
**Fase:** GO LIVE  
**Pré-requisito:** RC1 aprovada  
**Regra:** nenhum módulo novo — apenas implantação e validação operacional  

Use este checklist na ordem. Marque cada item após validação em **staging** e novamente em **produção**.

Relacionado: [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md) · [RC1_REPORT.md](./RC1_REPORT.md)

---

## 0. Gates técnicos (antes de publicar)

- [ ] `npm run check` na raiz OK
- [ ] `npm run build` na raiz OK
- [ ] `npx prisma migrate deploy` no ambiente alvo OK
- [ ] Swagger acessível em staging: `/api/docs`
- [ ] Backup do banco de staging/prod realizado e testado (restore smoke)

---

## 1. Configuração da empresa (CRM)

- [ ] Empresa Top Conceição criada/ativa no banco (`Empresa.ativo = true`)
- [ ] Nome fantasia / razão social corretos
- [ ] CNPJ cadastrado (quando aplicável)
- [ ] Telefone comercial correto
- [ ] E-mail comercial correto
- [ ] Plano adequado (Starter / Professional / Enterprise)
- [ ] Anotar o **ID numérico** da empresa → usar em `SITE_EMPRESA_ID`

---

## 2. Domínio

Definir e apontar DNS (exemplo sugerido — ajuste ao real):

| Serviço | Domínio sugerido | Aponta para |
|---------|------------------|-------------|
| CRM | `app.topconceicao.com.br` ou `crm.…` | Frontend (estático / Node) |
| API | `api.topconceicao.com.br` | Backend Node |
| Site | `www.topconceicao.com.br` (+ apex) | Next.js |

- [ ] DNS A/CNAME configurados (TTL documentado)
- [ ] Propagação verificada (`dig` / painel do provedor)
- [ ] CORS do backend inclui **apenas** origens HTTPS do CRM e do site
- [ ] Sem mistura de HTTP/HTTPS em produção

---

## 3. Logo e identidade

- [ ] Logo da imobiliária disponível em alta resolução (PNG/SVG)
- [ ] Favicon do CRM e do site atualizados (quando hospedados)
- [ ] `Empresa.logoUrl` preenchido se o fluxo público consumir logo
- [ ] Marca no site (nome, slogan, cores) conferida com material oficial
- [ ] Contatos do rodapé/site alinhados (`tokens` / env WhatsApp / e-mail)

---

## 4. E-mail

- [ ] Caixa comercial operacional (ex.: `contato@topconceicao.com.br`)
- [ ] SPF / DKIM / DMARC configurados no domínio (provedor de e-mail)
- [ ] E-mail da empresa no cadastro CRM confere com o domínio
- [ ] Processo definido: leads do site entram no CRM (não depender só de e-mail)
- [ ] (Opcional futuro) SMTP transacional — **não bloqueante** se ainda não houver módulo de e-mail

---

## 5. WhatsApp

- [ ] Número comercial com WhatsApp Business ativo
- [ ] Formato internacional no site: `NEXT_PUBLIC_WHATSAPP=55XXXXXXXXXXX` (só dígitos)
- [ ] Botão WhatsApp do header/detalhe do imóvel abre conversa correta
- [ ] Mensagem pré-preenchida no detalhe do imóvel inclui código do imóvel
- [ ] Equipe treinada para atender leads vindos do site e do CRM

---

## 6. Usuários

- [ ] Usuário **ADMIN** da Top Conceição criado (senha forte, não compartilhada)
- [ ] Conta DEMO desabilitada ou inexistente em produção (`seed:demo` **não** rodado em prod)
- [ ] Corretores operacionais criados (Configurações → Equipe ou módulo Corretores)
- [ ] Gerente(s) definidos, se houver
- [ ] E-mails de login únicos e corporativos
- [ ] Senhas iniciais trocadas no primeiro acesso
- [ ] Lista de usuários ativos documentada (nome, e-mail, perfil)

---

## 7. Perfis e permissões

| Perfil | Validar |
|--------|---------|
| ADMIN | Acesso total, Configurações, Financeiro, equipe |
| GERENTE | Operação ampla + Financeiro (conforme regra atual) |
| CORRETOR | Apenas própria carteira (imóveis/clientes/leads) |

- [ ] Login ADMIN OK
- [ ] Login GERENTE OK (se existir)
- [ ] Login CORRETOR OK — não enxerga dados de outros corretores
- [ ] CORRETOR **não** acessa `/financeiro` (rota protegida)
- [ ] Soft delete / reativação só por quem tem permissão

---

## 8. Banco de dados

- [ ] PostgreSQL 16+ em ambiente gerenciado (ou servidor dedicado)
- [ ] `DATABASE_URL` com SSL (`?sslmode=require` quando o provedor exigir)
- [ ] Usuário da aplicação com privilégios mínimos necessários
- [ ] Migrations aplicadas: `npx prisma migrate deploy`
- [ ] Índices RC1 presentes (Lead/Cliente/Tarefa/Agenda)
- [ ] Conexões máximas / pool adequados ao plano
- [ ] Sem dados de seed demo em produção

---

## 9. Backup

- [ ] Backup automático diário do PostgreSQL habilitado
- [ ] Retenção mínima definida (ex.: 7 diários + 4 semanais)
- [ ] Backup do volume/pasta `UPLOAD_DIR` (fotos de imóveis, avatares, anexos)
- [ ] Teste de **restore** documentado (data do último teste: ______)
- [ ] Responsável pelo restore definido (nome/contato)

---

## 10. Segurança

- [ ] `JWT_SECRET` forte e exclusivo de produção (≥ 32 caracteres aleatórios)
- [ ] `ALLOW_PUBLIC_SIGNUP=false` em produção
- [ ] `CORS_ORIGIN` restrito aos domínios oficiais (HTTPS)
- [ ] Secrets **não** commitados no Git
- [ ] Rate limit de login validado (tentativas inválidas → 429)
- [ ] Headers de segurança ativos (`X-Content-Type-Options`, `X-Frame-Options`, etc.)
- [ ] Uploads em disco persistente e fora do controle público direto
- [ ] Contas inativas desligadas (`Usuario.ativo = false`)
- [ ] Acesso SSH/painel do host com MFA quando disponível
- [ ] Swagger em produção: decidir se permanece público ou restringe por IP/VPN

---

## 11. Variáveis de ambiente

### Backend (obrigatórias)

| Variável | Produção |
|----------|----------|
| `DATABASE_URL` | Connection string prod |
| `JWT_SECRET` | Secreto forte |
| `PORT` | Conforme host (ex. 3000) |
| `CORS_ORIGIN` | `https://crm…,https://www…` |
| `UPLOAD_DIR` | Caminho persistente |
| `ALLOW_PUBLIC_SIGNUP` | `false` |
| `SITE_EMPRESA_ID` | ID Top Conceição |

- [ ] Todas preenchidas e revisadas por segunda pessoa

### Frontend CRM

| Variável | Produção |
|----------|----------|
| `VITE_API_URL` | `https://api.…` |

- [ ] Build feito **depois** de definir `VITE_API_URL` (Vite embute no build)

### Site

| Variável | Produção |
|----------|----------|
| `NEXT_PUBLIC_SITE_URL` | `https://www.…` |
| `NEXT_PUBLIC_SUSSAI_API_URL` | `https://api.…/api` (obrigatório incluir `/api`) |
| `SUSSAI_API_URL` | `https://api.…/api` (server-side) |
| `NEXT_PUBLIC_WHATSAPP` | Número oficial |
| `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` | Se usar chave própria |

- [ ] Build/redeploy após alterar qualquer `NEXT_PUBLIC_*`

---

## 12. SSL / HTTPS

- [ ] Certificado válido na API
- [ ] Certificado válido no CRM
- [ ] Certificado válido no site
- [ ] Redirect HTTP → HTTPS
- [ ] Sem avisos de conteúdo misto (mixed content)
- [ ] Renovação automática (Let's Encrypt / provedor) ativa

---

## 13. Publicação da API

- [ ] Processo Node (PM2 / systemd / container) sobe e reinicia sozinho
- [ ] Health: `GET /` retorna `status: ONLINE`
- [ ] `GET /api/docs` OK (ou bloqueado de propósito)
- [ ] `GET /public/imoveis` retorna dados da Top Conceição (não 503)
- [ ] Logs de erro sem stack sensível para o cliente
- [ ] Limite de body / CORS validados com origem do site

---

## 14. Publicação do CRM (frontend)

- [ ] Build `npm run build` gerado com `VITE_API_URL` de produção
- [ ] Hosting estático (Nginx/CDN/Vercel/etc.) servindo `frontend/dist`
- [ ] SPA fallback: rotas `/imoveis`, `/leads`, etc. não dão 404 no refresh
- [ ] Login em produção OK
- [ ] Upload de foto de imóvel funciona (API + disco persistente)
- [ ] Tema claro/escuro OK

---

## 15. Publicação do site

- [ ] Next.js em modo `start` (ou hosting Node compatível) / plataforma com SSR
- [ ] Home lista imóveis reais do CRM
- [ ] Detalhe `/imoveis/[slug]` com galeria e mapa
- [ ] Formulário de interesse cria Lead no CRM
- [ ] Contato / Avalie criam Lead
- [ ] Agendar visita cria evento na Agenda (quando marcado)
- [ ] `sitemap.xml` e `robots.txt` acessíveis
- [ ] Open Graph / título das páginas corretos
- [ ] WhatsApp e telefone corretos no header/rodapé

---

## 16. Publicação no CRM → Site (conteúdo)

- [ ] Imóveis operacionais com **Publicado no site**
- [ ] Destaques / lançamentos / alto padrão marcados conforme home
- [ ] Slugs amigáveis gerados
- [ ] Fotos principais definidas
- [ ] Corretores ativos aparecem no site
- [ ] Alteração no CRM reflete no site (revalidação / refresh)

---

## 17. LGPD

- [ ] Aviso de privacidade / política publicada (site ou link oficial)
- [ ] Base legal definida para captura de leads (consentimento / legítimo interesse)
- [ ] Texto do formulário do site informa uso dos dados para retorno comercial
- [ ] Canal para solicitação de exclusão/acesso (e-mail DPO ou responsável)
- [ ] Acesso ao CRM restrito a colaboradores autorizados
- [ ] Dados de proprietários/clientes tratados como confidencial
- [ ] Retenção: política mínima documentada (leads inativos, anexos)
- [ ] Backup também sujeito a controles de acesso

---

## 18. Logs

- [ ] Logs da API persistidos (arquivo ou provedor) com rotação
- [ ] Logs do reverse proxy (Nginx/Caddy) com acesso e erro
- [ ] Sem senhas/tokens impressos em log
- [ ] Horário dos logs em UTC ou timezone documentado
- [ ] Retenção de logs definida (ex.: 30 dias)

---

## 19. Monitoramento

- [ ] Uptime check na API (`GET /`)
- [ ] Uptime check no CRM (URL de login)
- [ ] Uptime check no site (home)
- [ ] Alerta por e-mail/WhatsApp se cair (UptimeRobot, Better Stack, etc.)
- [ ] Disco do servidor: alerta se `UPLOAD_DIR` / DB > 80%
- [ ] Processo Node monitorado (PM2 status / health do PaaS)
- [ ] Responsável de plantão nas primeiras 72h pós go-live

---

## 20. Smoke test final (dia D)

Executar com usuário real da Top Conceição:

1. [ ] Login CRM  
2. [ ] Criar/editar imóvel e marcar **Publicado no site**  
3. [ ] Ver imóvel no site  
4. [ ] Enviar lead pelo site → aparece no Pipeline  
5. [ ] Agendar visita pelo site → aparece na Agenda  
6. [ ] Criar tarefa e contrato smoke (se operação do dia)  
7. [ ] Financeiro: dashboard abre para ADMIN/GERENTE  
8. [ ] Logout / login de um corretor com escopo correto  

---

## 21. Comunicação e operação

- [ ] Equipe treinada (login, imóveis, pipeline, agenda, site)
- [ ] Contatos de suporte técnico definidos
- [ ] Credenciais guardadas em cofre (1Password / Bitwarden / etc.)
- [ ] Rollback plan lido: [DEPLOY_GUIDE.md § Rollback](./DEPLOY_GUIDE.md#rollback)
- [ ] Go-live autorizado por: _________________ Data/hora: _________________

---

## Assinatura

| Papel | Nome | Data | OK |
|-------|------|------|----|
| Responsável Top Conceição | | | [ ] |
| Responsável técnico SUSSAI | | | [ ] |

**Status go-live:** ☐ Staging OK · ☐ Produção OK · ☐ Aguardando aprovação
