import { Router } from "express";
import { sendOk } from "../../lib/apiResponse.js";

/**
 * Liquidity management module — Module 10.
 * Planned endpoints: GET /pools, GET /ledger (admin-only).
 * Owner: ____  (fill in via PROMPTS.md Module 10)
 */
export const liquidityRouter = Router();

liquidityRouter.get("/", (_req, res) => {
  sendOk(res, { module: "liquidity", status: "not_implemented" });
});
