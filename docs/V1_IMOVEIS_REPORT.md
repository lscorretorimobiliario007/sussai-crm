# V1.0 — Cadastro de Imóveis (Operação Real)

**Status:** concluída — aguardando aprovação  
**Data:** 2026-07-16  
**Escopo:** refinamento do módulo Imóveis existente (sem novos módulos)  
**Cliente:** Top Conceição Imóveis

---

## Objetivo

Tornar o cadastro de imóveis o mais completo possível para operação diária, com campos que realmente fazem diferença comercial e documental.

---

## Entregas

### Banco — migration `20260716220000_v1_imoveis_operacao`

Novos campos em `Imovel`:

| Grupo | Campos |
|-------|--------|
| Documentação | `matricula`, `inscricaoMunicipal`, `habiteSe`, `averbacao`, `angariadorId`, `dataCaptacao` |
| Comercial | `aceitaFgts`, `aceitaVeiculo`, `estudaProposta`, `chavesNaImobiliaria`, `chaveDigital` |
| SEO | `seoTitulo`, `seoDescricao` (além de `slug`) |
| Mídia | `plantaUrl` (além de `tourVirtualUrl`, `videoUrl`) |

Já existentes mantidos: IPTU/condomínio (valores), exclusividade, financiamento, permuta, ocupação, chaves, publicação site, geo, galeria.

### Formulário CRM (abas)

1. **Principais** — identificação, valores, áreas, responsáveis, descrições  
2. **Localização** — endereço completo, **CEP ViaCEP**, lat/lng, abrir Google Maps  
3. **Documentação** — matrícula, inscrição, IPTU/condomínio, habite-se, averbação, exclusividade, angariador, captação  
4. **Comercial** — FGTS, veículo, proposta, chaves, chave digital, publicação site/destaque/lançamento  
5. **Características** — catálogo ampliado (solar, poço, portão, sacada, semi-mobiliado, automação, etc.)  
6. **SEO & Mídia** — título SEO, slug, meta description, tour, vídeo, planta  
7. **Galeria** — drag-and-drop (`@dnd-kit`), foto principal, ordem, upload  

### API

- `IMOVEL_FIELDS` / validações / booleans / datas atualizados  
- Relação `angariador` no detalhe  
- Características públicas e filtros do site ampliados  
- Site usa `seoTitulo` / `seoDescricao` no metadata do imóvel  

---

## Gates

- `npm run check`  
- `npm run build`  

---

## Como validar

1. CRM → Imóveis → Novo / Editar  
2. Buscar CEP e conferir preenchimento  
3. Preencher documentação + comercial  
4. Na edição, arrastar fotos e definir principal  
5. Publicar no site e conferir SEO no detalhe público  

---

**Aguardando aprovação da V1 Imóveis.**
