/**
 * PM2 — SUSSAI API (NestJS). NÃO use src/server.js (Express legado).
 * Uso: cd backend && npm run build && pm2 start ecosystem.config.cjs --env production
 */
module.exports = {
  apps: [
    {
      name: 'sussai-api',
      script: 'dist/src/main.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
