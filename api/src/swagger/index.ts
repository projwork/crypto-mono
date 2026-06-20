import type { Express, Request, Response } from "express";
import swaggerUi from "swagger-ui-express";
import { openApiSpec } from "./openapi.js";

/**
 * Mounts Swagger UI for the full API at /api/docs.
 * Raw OpenAPI JSON is available at /api/docs/openapi.json.
 */
export const mountApiDocs = (app: Express): void => {
  app.get("/api/docs/openapi.json", (_req: Request, res: Response) => {
    res.json(openApiSpec);
  });

  app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(openApiSpec, {
      customSiteTitle: "Crypto Remittance API Docs",
      swaggerOptions: {
        persistAuthorization: true,
        tryItOutEnabled: true,
        displayRequestDuration: true,
      },
    }),
  );
};
