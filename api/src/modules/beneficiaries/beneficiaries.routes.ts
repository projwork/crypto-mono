import { Router } from "express";
import { sendOk } from "../../lib/apiResponse.js";

/**
 * Beneficiary directory module — Module 4.
 * Planned endpoints: POST /, GET /, GET /:id, PUT /:id, DELETE /:id, POST /:id/favorite.
 * Owner: ____  (fill in via PROMPTS.md Module 4)
 */
export const beneficiariesRouter = Router();

beneficiariesRouter.get("/", (_req, res) => {
  sendOk(res, { module: "beneficiaries", status: "not_implemented" });
});
