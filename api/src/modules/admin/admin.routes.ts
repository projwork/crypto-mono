import { Router } from "express";
import { sendOk } from "../../lib/apiResponse.js";

/**
 * Admin module — Modules 5, 10, 11, 13.
 * Planned endpoints: GET /stats, GET /audit, POST /fx-rate, KYC approvals,
 * transfer overrides/reconciliation.
 * Owner: ____  (fill in via PROMPTS.md Admin-related steps)
 */
export const adminRouter = Router();

adminRouter.get("/", (_req, res) => {
  sendOk(res, { module: "admin", status: "not_implemented" });
});
