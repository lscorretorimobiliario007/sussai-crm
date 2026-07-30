# V1 Imóveis — Refinamento Final

**Status:** concluída — aguardando aprovação  
**Data:** 2026-07-16  
**Escopo:** refinamento operacional do módulo Imóveis (sem novos módulos)  
**Cliente:** Top Conceição Imóveis

---

## Objetivo

Elevar o cadastro de imóveis do SUSSAI ao nível de operação diária completa: captação, proprietário à vista, histórico de chaves, painel de publicação e timeline auditável.

---

## Entregas

### Captação

| Campo | Implementação |
|-------|----------------|
| Data da captação | `dataCaptacao` (já existia) |
| Corretor captador | `angariadorId` — label operacional “Corretor captador” |
| Origem da captação | `origemCaptacao` (enum) |
| Situação da captação | `situacaoCaptacao` (enum) |
| Data da última atualização | `updatedAt` (automático) |
| Próximo contato com proprietário | `proximoContatoProprietario` |

Aba dedicada **Captação** no formulário + card no detalhe.

### Proprietário no detalhe

Sem abrir outra tela: **nome**, **WhatsApp** (link `wa.me`), **telefone** (`tel:`) e **e-mail** (`mailto:`).

### Histórico de chaves

Modelo `ImovelChaveHistorico` + registro automático em `atualizarImovel` ao mudar `chaveRetirada`.

Registra: ação (retirada/devolução), quem retirou/devolveu, data/hora, observação, usuário que registrou.

Exibido no formulário (aba Comercial) e no detalhe.

Endpoint: `GET /imoveis/:id/chaves/historico`.

### Painel de publicação

Aba **Publicação** com checkboxes:

- Publicar no site  
- Destaque Home  
- Alto Padrão  
- Comercial (`publicacaoComercial`)  
- Lançamento  
- Oculto  
- Em revisão  

Site público exige: `publicadoSite && !oculto && !emRevisao`.

### Timeline

Enum ampliado: `PUBLICADO`, `RETIRADO_SITE`, `PRECO_ALTERADO`, `PROPRIETARIO_ALTERADO`, `CHAVE_RETIRADA`, `CHAVE_DEVOLVIDA`.

Eventos gerados automaticamente na atualização. UI mostra usuário, data/hora e descrição legível.

### Qualidade

- Removida duplicidade de `caracteristicas` em `/imoveis/opcoes`
- Captação/publicação saíram da aba Comercial (organização)
- Campos duplicados de angariador/captação removidos da Documentação
- Consulta do detalhe inclui `chaveHistorico` e `whatsapp` do proprietário
- Índice composto site: `publicadoSite + ativo + oculto + emRevisao`

### Migration

`20260716230000_v1_imoveis_refinamento_final`

---

## Abas do formulário

1. Principais  
2. Localização  
3. Captação  
4. Documentação  
5. Comercial (+ chaves)  
6. Publicação  
7. Características  
8. SEO & Mídia  
9. Galeria  

---

## Gates

| Comando | Resultado |
|---------|-----------|
| `npm run check` | OK |
| `npm run build` | OK |

---

## Como validar

1. Editar imóvel → aba Captação (origem, situação, próximo contato)  
2. Detalhe → card Proprietário com WhatsApp/telefone/e-mail clicáveis  
3. Marcar chave retirada → salvar → conferir histórico automático  
4. Aba Publicação → Oculto / Em revisão → imóvel some do site  
5. Alterar preço ou proprietário → timeline registra evento específico  

---

**Aguardando aprovação do Refinamento Final de Imóveis.**
