# SUSSAI CRM — Relatório Sprint R1 (Refinamento Imóveis)

**Data:** 16/Jul/2026  
**Fase:** Refinamento (pós Sprint 7)  
**Status:** Concluída  
**Escopo:** melhoria do módulo de Imóveis + preparação de filtros para o site  
**Paralelo:** [SITE_MASTER_PLAN.md](SITE_MASTER_PLAN.md) (documentação only)

## Objetivo

Enriquecer o cadastro de imóveis com controle operacional (chaves), condições comerciais e catálogo canônico de comodidades filtráveis no CRM e reutilizáveis pelo site da Top Conceição.

## Entregas

### Banco (`20260716180000_imoveis_refinamento_r1`)

| Campo / enum | Descrição |
|--------------|-----------|
| `OcupacaoImovel` | DESOCUPADO, OCUPADO_PROPRIETARIO, OCUPADO_INQUILINO, EM_REFORMA |
| `exclusividade` | Boolean |
| `aceitaFinanciamento` | Boolean |
| `aceitaPermuta` | Boolean |
| `ocupacao` | Enum |
| `observacoesInternas` | Texto interno (não público) |
| `localChaves` | Local das chaves |
| `codigoChave` | Código da chave |
| `chaveRetirada` | Controle de retirada |
| `chaveRetiradaEm` / `chaveRetiradaPor` | Trilha da retirada |
| `chaveDevolvidaEm` | Controle de devolução |
| `chaveObservacoes` | Obs. do controle |

### Backend

- Allowlist e validação dos novos campos
- Catálogo expandido de `caracteristicas` (CRM + site)
- Sync `piscina`/`churrasqueira` ↔ códigos `PISCINA`/`CHURRASQUEIRA`
- Filtros de listagem: comodidades, exclusividade, financiamento, permuta, ocupação, chave retirada
- `GET /imoveis/opcoes` retorna `ocupacoes`, `caracteristicas`, `filtrosSite`

### Frontend

- Formulário reorganizado em 8 seções
- Detalhes exibem condições, chaves e observações internas
- Listagem com chips dos 16 filtros canônicos do site + filtros comerciais

### Filtros canônicos (CRM + site)

Piscina, Edícula, Churrasqueira, Área Gourmet, Jardim, Closet, Escritório, Lavabo, Mobiliado, Planejados, Academia, Quadra, Salão de festas, Elevador, Portaria, Energia Solar.

## Auditoria

| Verificação | Resultado |
|-------------|-----------|
| Migration aplicada | OK |
| Backend `npm run check` | OK |
| Frontend `npm run build` | OK |
| Novos módulos | Nenhum |
| Código do site | Nenhum (apenas docs) |

### Nota

`prisma generate` pode falhar com `EPERM` no Windows se o `node` do backend estiver com o query engine aberto; reiniciar o processo e regenerar resolve. Tipos do client já incluem os novos campos.

## Arquivos principais

- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/20260716180000_imoveis_refinamento_r1/`
- `backend/src/controllers/imovelController.js`
- `frontend/src/utils/imoveis.js`
- `frontend/src/pages/ImovelForm.jsx`
- `frontend/src/pages/Imoveis.jsx`
- `frontend/src/pages/ImovelDetalhes.jsx`
- `docs/SITE_MASTER_PLAN.md`
- `docs/SPRINT_R1_REPORT.md`
