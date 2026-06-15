import { Router } from "express";
import { sendOk } from "../../lib/apiResponse.js";

/**
 * KYC module — Module 3.
 * Planned endpoints: POST /submit, GET /status, admin approve/reject.
 * Owner: ____  (fill in via PROMPTS.md Module 3)
 */
export const kycRouter = Router();

kycRouter.get("/", (_req, res) => {
  sendOk(res, { module: "kyc", status: "not_implemented" });
});
