import "dotenv/config";
import app from "./app.js";

const requiredEnv = ["DATABASE_URL", "JWT_SECRET"];
const missingEnv = requiredEnv.filter((name) => !process.env[name]);
if (missingEnv.length > 0) {
  throw new Error(`Variáveis de ambiente obrigatórias ausentes: ${missingEnv.join(", ")}`);
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 SUSSAI CRM API rodando em http://localhost:${PORT}`);
});
