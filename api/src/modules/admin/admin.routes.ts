import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { authMiddleware, requireRole } from "../../middleware/auth.js";
import { sendOk } from "../../lib/apiResponse.js";
import { updateFxRateSchema } from "../fx/fx.schemas.js";
import { fxService } from "../fx/fx.service.js";

/**
 * Admin module — Modules 5, 10, 11, 13.
 */
export const adminRouter = Router();

adminRouter.use(authMiddleware, requireRole("ADMIN"));

adminRouter.post(
  "/fx-rate",
  asyncHandler(async (req, res) => {
    const input = updateFxRateSchema.parse(req.body);
    const rate = await fxService.setRate(input);
    sendOk(res, {
      usdToEtb: rate.usdToEtb,
      chfToEtb: rate.chfToEtb,
      timestamp: rate.timestamp.toISOString(),
      source: rate.source,
    }, 201);
  }),
);

adminRouter.get("/", (_req, res) => {
  sendOk(res, {
    module: "admin",
    endpoints: ["POST /fx-rate"],
  });
});
