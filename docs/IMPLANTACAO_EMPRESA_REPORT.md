# Implantação — Configurações da Empresa (Top Conceição)

**Status:** concluída — aguardando aprovação  
**Data:** 2026-07-16  
**Cliente-alvo:** Top Conceição Imóveis (primeiro tenant oficial)  
**Regra:** sem novo módulo de menu — extensão de **Configurações** + API `/empresa`

---

## Objetivo

Centralizar o perfil institucional da imobiliária para alimentar automaticamente CRM, site, metadados, rodapé e contato.

---

## O que foi entregue

### Banco (`Empresa`)
Novos campos (migration `20260716210000_empresa_implantacao`):

- Identidade: `nomeFantasia`, `creci`, `slogan`
- Marca: `logoArquivo`, `faviconUrl`/`faviconArquivo`, `corPrimaria`, `corSecundaria`
- Contato: `whatsapp`, `siteUrl`, endereço completo, redes sociais, `horarioAtendimento`
- Maps: `googleMapsUrl`, `latitude`, `longitude`
- Site/SEO: `siteTitulo`, `siteDescricao`, `seoKeywords`, `siteAtivo`, `siteExibirCorretores`, `siteExibirBlog`

### API (não é módulo comercial novo)
| Método | Rota | Quem |
|--------|------|------|
| GET | `/empresa` | autenticado |
| PUT | `/empresa` | ADMIN |
| POST | `/empresa/logo` | ADMIN (upload) |
| POST | `/empresa/favicon` | ADMIN (upload) |
| GET | `/empresa/logo/arquivo` | autenticado (preview CRM) |
| GET | `/public/empresa` | site |
| GET | `/public/empresa/logo` · `/favicon` | site |

### CRM
Tela **Configurações** com formulário completo da empresa + equipe.  
Sidebar exibe `nomeFantasia` / nome da empresa.

### Site
`loadBrand()` consome `/public/empresa` e alimenta:

- Header / Footer / Contato / Hero
- `generateMetadata` (título, descrição, keywords, favicon)
- WhatsApp e cores de destaque
- Flags de exibição (corretores / blog)

Fallbacks em `theme/tokens.ts` se a API estiver indisponível.

### Demo seed
Empresa demo alinhada à identidade Top Conceição (nome, CRECI, cores, slogan, SEO).

---

## Como usar (Top Conceição)

1. Login ADMIN no CRM  
2. **Configurações** → preencher dados oficiais → **Salvar empresa**  
3. Enviar logo e favicon  
4. Garantir `SITE_EMPRESA_ID` = ID dessa empresa no backend  
5. Site passa a refletir os dados automaticamente  

---

## Gates

Executar na raiz:

- `npm run check`
- `npm run build`

---

## Fora de escopo

- Novo item de menu / módulo comercial
- CMS de blog no CRM
- White-label multi-site além do `SITE_EMPRESA_ID` atual

---

**Aguardando aprovação da implantação.**
