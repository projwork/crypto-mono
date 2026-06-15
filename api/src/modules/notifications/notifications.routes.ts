import { Router } from "express";
import { sendOk } from "../../lib/apiResponse.js";

/**
 * Notifications module — Module 11.
 * Planned endpoints: GET /, POST /:id/read.
 * Owner: ____  (fill in via PROMPTS.md Module 11)
 */
export const notificationsRouter = Router();

notificationsRouter.get("/", (_req, res) => {
  sendOk(res, { module: "notifications", status: "not_implemented" });
});
