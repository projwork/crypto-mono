import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { authMiddleware } from "../../middleware/auth.js";
import { sendOk } from "../../lib/apiResponse.js";
import {
  listMyNotifications,
  markNotificationRead,
} from "./notifications.service.js";

/**
 * Notifications module — Module 11.
 */
export const notificationsRouter = Router();

notificationsRouter.use(authMiddleware);

notificationsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const notifications = await listMyNotifications(
      req.user!.id,
      Number.isFinite(limit) ? limit : 50,
    );
    sendOk(res, { notifications });
  }),
);

notificationsRouter.post(
  "/:id/read",
  asyncHandler(async (req, res) => {
    const notification = await markNotificationRead(req.user!.id, req.params.id);
    sendOk(res, { notification });
  }),
);
