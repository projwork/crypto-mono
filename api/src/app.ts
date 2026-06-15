import path from "node:path";
import express, { type Express } from "express";
import cors from "cors";
import morgan from "morgan";
import { config } from "./config/index.js";
import { sendOk } from "./lib/apiResponse.js";
import { apiRouter } from "./routes/index.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";

/** Builds and configures the Express application (without starting it). */
export const createApp = (): Express => {
  const app = express();

  app.use(
    cors({
      origin: config.corsOrigins.length > 0 ? config.corsOrigins : true,
      credentials: true,
    }),
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan(config.env === "development" ? "dev" : "combined"));

  // Serve uploaded files (e.g. KYC documents) statically for the prototype.
  app.use("/uploads", express.static(path.resolve(config.uploadDir)));

  // Health check — used by the web app and infra probes.
  app.get("/health", (_req, res) => {
    sendOk(res, {
      status: "ok",
      service: "crypto-remittance-api",
      env: config.env,
      timestamp: new Date().toISOString(),
    });
  });

  app.use("/api", apiRouter);

  // 404 + global error handler must be registered last.
  app.use(notFound);
  app.use(errorHandler);

  return app;
};
