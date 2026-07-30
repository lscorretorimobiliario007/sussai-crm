import express from "express";
import cors from "cors";
import multer from "multer";
import routes from "./routes/index.js";

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim());

app.disable("x-powered-by");
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origem não permitida"));
  },
  credentials: true,
}));
app.use(express.json({ limit: "1mb" }));
app.use((req, res, next) => {
  if (!["POST", "PUT", "PATCH"].includes(req.method)) return next();
  const contentType = req.headers["content-type"] || "";
  if (contentType.includes("multipart/form-data")) return next();
  if (req.body == null) {
    req.body = {};
    return next();
  }
  if (typeof req.body !== "object" || Array.isArray(req.body)) {
    return res.status(400).json({ erro: "Envie um objeto JSON válido no corpo da requisição" });
  }
  return next();
});
app.use(routes);
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ erro: "JSON inválido" });
  }
  if (error.message === "Origem não permitida") {
    return res.status(403).json({ erro: error.message });
  }
  if (error instanceof multer.MulterError) {
    const message = error.code === "LIMIT_FILE_SIZE"
      ? "Arquivo excede o tamanho máximo permitido"
      : "Envie arquivos nos formatos permitidos e dentro do limite";
    return res.status(400).json({ erro: message });
  }
  if (error.status === 404) {
    return res.status(404).json({ erro: "Arquivo não encontrado" });
  }
  return res.status(500).json({ erro: "Erro interno do servidor" });
});

export default app;
