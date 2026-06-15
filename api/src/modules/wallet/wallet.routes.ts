import { Router } from "express";
import { sendOk } from "../../lib/apiResponse.js";

/**
 * Wallet & crypto deposit module — Module 6.
 * Planned endpoints: GET /deposit-address, GET /transfers/:id/deposit-instructions.
 * Owner: ____  (fill in via PROMPTS.md Module 6)
 */
export const walletRouter = Router();

walletRouter.get("/", (_req, res) => {
  sendOk(res, { module: "wallet", status: "not_implemented" });
});
