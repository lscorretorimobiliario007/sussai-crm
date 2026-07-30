import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import { openApiSpec } from "../docs/openapi.js";

const router = Router();

router.get("/openapi.json", (_req, res) => {
  res.json(openApiSpec);
});

// Mount UI after JSON route so /openapi.json is not swallowed by swagger-ui
router.use(
  swaggerUi.serve,
  swaggerUi.setup(openApiSpec, {
    customSiteTitle: "SUSSAI API Docs",
    swaggerOptions: { persistAuthorization: true, displayRequestDuration: true },
  }),
);

export default router;
