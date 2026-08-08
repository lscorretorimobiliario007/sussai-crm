# Recuperação Total — Sincronização Prisma / Banco / Código

**Data:** 2026-08-07  
**Método:** `migrate deploy` + `migrate status` + `migrate diff` (sem `db push`)

## Prisma / Banco

| Item | Resultado |
|------|-----------|
| `prisma validate` | Schema válido |
| Migrations | **31** aplicadas |
| `migrate status` | Database schema is up to date |
| Drift DB ↔ schema | Nenhum |
| `prisma generate` | OK |
| Seed ADMIN/GERENTE/CORRETOR | OK (`Admin@123`) |

## Contratos validados

| Fluxo | Resultado |
|-------|-----------|
| Login smoke + refresh | OK |
| Proprietário com `email:""` / `estado:""` | 201 (normalizado null) |
| Imóvel sem `proprietarioId` | 400 |
| Imóvel com proprietário | 201 |
| Leads públicos CONTATO/VISITA/CAPTACAO | 201 |
| Upload multipart `/properties/:id/images` | OK |
| Fotos públicas `imagemCapa` | OK |
| E2E estabilização | PASSED |
| Unit tests | 18/18 |
| Backend/Frontend/Site build+lint | OK |

## Alinhamento DTO ↔ Frontend

- **CreatePropertyDto**: `proprietarioId` obrigatório — espelhado em `ImovelForm` + `PropertyOwnerSelector`
- **CreatePropertyOwnerDto**: opcionais com empty→null — espelhado em `ProprietarioForm`
- **DB**: `proprietarioId Int?` permanece nullable para registros legados; regra de negócio no create (API)

## Conclusão

Frontend, backend, Prisma e banco estão sincronizados. Nenhum `db push` foi usado.
