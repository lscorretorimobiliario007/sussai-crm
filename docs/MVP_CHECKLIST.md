# SUSSAI CRM — Checklist do MVP

**Atualizado:** 16/Jul/2026  
**Objetivo:** validar que o MVP está sólido para uso comercial controlado (piloto).

Marque cada item após validação manual no ambiente local/staging.

---

## 0. Ambiente

- [ ] Backend `npm run check` OK
- [ ] Frontend `npm run build` OK
- [ ] `npx prisma migrate deploy` sem erro
- [ ] `.env` com `JWT_SECRET` forte (≥32 chars em produção)
- [ ] Produção: `ALLOW_PUBLIC_SIGNUP=false` (se não houver onboarding aberto)
- [ ] CORS apontando só para o domínio do frontend

---

## 1. Autenticação

- [ ] Login com credenciais válidas
- [ ] Login inválido retorna erro claro
- [ ] Após ~20 tentativas em 15 min, rate limit 429
- [ ] Logout redireciona para `/login`
- [ ] Token expirado força re-login (401)
- [ ] Usuário inativo / empresa inativa não autenticam
- [ ] Registro público: comportamento esperado conforme `ALLOW_PUBLIC_SIGNUP`

---

## 2. Dashboard

- [ ] Cards carregam sem erro
- [ ] ADMIN/GERENTE veem financeiro (se aplicável)
- [ ] CORRETOR vê apenas sua carteira nos totais de clientes/proprietários/imóveis/leads
- [ ] Atalhos para Proprietários e Corretores funcionam
- [ ] Leads recentes mostram etapa do funil

---

## 3. Clientes

- [ ] Lista **não** inclui proprietários por padrão
- [ ] Cadastro PF/PJ, filtros, paginação
- [ ] Avatar aparece na lista e no detalhe
- [ ] Contatos, documentos, anotações, favoritos
- [ ] Soft delete + reativar
- [ ] Export Excel com sucesso; erro de API mostra mensagem legível
- [ ] Não é possível criar `tipo: PROPRIETARIO` por `/clientes`

---

## 4. Imóveis

- [ ] CRUD completo, fotos autenticadas, galeria
- [ ] Filtros + paginação
- [ ] Soft delete / reativar
- [ ] CORRETOR só vê/edita próprios (conforme regra)
- [ ] Select de proprietários respeita ownership do corretor

---

## 5. Agenda

- [ ] Visões mês/semana/dia/lista
- [ ] Criar visita/reunião/ligação/tarefa
- [ ] Drag para reagendar
- [ ] Vínculo com cliente/imóvel/corretor
- [ ] Notificações internas da agenda

---

## 6. Pipeline CRM

- [ ] Kanban carrega etapas
- [ ] Drag entre colunas
- [ ] Perda exige motivo
- [ ] Drawer: comentários, anexos, tarefas, agenda
- [ ] Dashboard comercial (funil/conversão)
- [ ] CORRETOR só vê próprios leads

---

## 7. Proprietários

- [ ] Cadastro PF/PJ + dados bancários
- [ ] Contatos sincronizados no create e no edit
- [ ] Upload de documentos
- [ ] Imóveis vinculados no detalhe
- [ ] Anotações + histórico
- [ ] Soft delete / reativar
- [ ] Pesquisa, filtros, paginação

---

## 8. Corretores

- [ ] ADMIN/GERENTE criam corretores
- [ ] GERENTE **não** consegue criar/promover ADMIN
- [ ] Foto, CRECI/CREA, meta, comissão, equipe, status
- [ ] Ranking e indicadores (vendas, captação, conversão, meta, comissão)
- [ ] Detalhe mostra pipeline / imóveis / agenda
- [ ] CORRETOR edita apenas o próprio perfil (campos limitados)

---

## 9. Módulos legados (piloto)

- [ ] Contratos: listar/criar sem crash; tabela scrollável no mobile
- [ ] Tarefas: criar/concluir/excluir com feedback de erro
- [ ] Financeiro (ADMIN/GERENTE): listar, pagar, gerar mensais
- [ ] Configurações: listar usuários (sem travar)

---

## 10. Segurança rápida

- [ ] Trocar de empresa no JWT não vaza dados (token revalida empresa)
- [ ] Arquivos de foto/documento exigem auth
- [ ] Multipart em lead anexos rejeita ID de outra empresa **antes** de gravar
- [ ] Soft-deleted cliente sem token de compartilhamento ativo

---

## 11. UX / responsivo / a11y (smoke)

- [ ] Sidebar mobile abre/fecha
- [ ] Telas core usáveis em 375px
- [ ] Tabelas legadas não estouram a viewport (scroll horizontal)
- [ ] Botões icon-only têm `aria-label` onde crítico (tarefas/financeiro)
- [ ] Tema claro/escuro funciona

---

## Critério de “MVP sólido”

Considere o MVP **aprovado para piloto** quando:

1. Itens das seções **1–8** estão ≥ 90% OK  
2. Seção **10** 100% OK  
3. Build/check/migrate verdes  
4. Nenhum bug crítico aberto em `MVP_AUDITORIA.md`

Próximo passo após aprovação do piloto: seguir [ROAD_TO_V1.md](ROAD_TO_V1.md) — **sem abrir Sprint 7 até decisão explícita**.
