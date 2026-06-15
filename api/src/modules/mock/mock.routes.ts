import { Router } from "express";
import { sendOk } from "../../lib/apiResponse.js";

/**
 * Mock external APIs — Modules 5 & 7.
 * Planned endpoints:
 *   GET  /fx-rate                          (Module 5)
 *   POST /blockchain/confirm               (Module 7)
 *   POST /swiss/deposit-confirmation       (Module 7)
 *   GET  /swiss/balance                    (Module 7)
 *   POST /swiss/withdraw                   (Module 7)
 *   POST /payout/cbe | /awash | /dashen | /telebirr  (Module 7)
 * Owner: ____  (fill in via PROMPTS.md Modules 5 & 7)
 */
export const mockRouter = Router();

mockRouter.get("/", (_req, res) => {
  sendOk(res, { module: "mock", status: "not_implemented" });
});
