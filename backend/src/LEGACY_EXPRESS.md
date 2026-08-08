/**
 * Express legado (src/server.js, src/app.js, src/routes/**, src/controllers/**).
 *
 * O runtime oficial é NestJS:
 *   npm run build && npm run start:prod
 *   pm2 start ecosystem.config.cjs --env production
 *
 * NÃO inicie `node src/server.js` em produção — faltam rotas Nest
 * (health, refresh, site leads, etc.) e o schema/uploads divergem.
 */
