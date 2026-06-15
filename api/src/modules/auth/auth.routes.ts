import { Router } from "express";
import { sendOk } from "../../lib/apiResponse.js";

/**
 * Auth module — Module 2.
 * Planned endpoints: POST /register, POST /login, POST /refresh, POST /logout, GET /me.
 * Owner: ____  (fill in via PROMPTS.md Module 2)
 */
export const authRouter = Router();

authRouter.get("/", (_req, res) => {
  sendOk(res, { module: "auth", status: "not_implemented" });
});
