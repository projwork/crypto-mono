import { Router } from "express";
import { sendOk } from "../../lib/apiResponse.js";

/**
 * Transfers module — Modules 8 & 9.
 * Planned endpoints: POST /quote, POST /, GET /, GET /:id, GET /:id/timeline,
 * GET /:id/events (SSE), POST /:id/simulate-deposit.
 * Owner: ____  (fill in via PROMPTS.md Modules 8 & 9)
 */
export const transfersRouter = Router();

transfersRouter.get("/", (_req, res) => {
  sendOk(res, { module: "transfers", status: "not_implemented" });
});
