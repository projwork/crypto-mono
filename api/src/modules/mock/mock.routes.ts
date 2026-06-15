import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { sendOk } from "../../lib/apiResponse.js";
import { fxService } from "../fx/fx.service.js";

/**
 * Mock external APIs — Modules 5 & 7.
 */
export const mockRouter = Router();

mockRouter.get(
  "/fx-rate",
  asyncHandler(async (_req, res) => {
    const rate = await fxService.getCurrentRate();
    sendOk(res, {
      usdToEtb: rate.usdToEtb,
      chfToEtb: rate.chfToEtb,
      timestamp: rate.timestamp.toISOString(),
    });
  }),
);

mockRouter.get("/", (_req, res) => {
  sendOk(res, {
    module: "mock",
    endpoints: [
      "GET /fx-rate",
      "POST /blockchain/confirm",
      "POST /swiss/deposit-confirmation",
      "GET /swiss/balance",
      "POST /swiss/withdraw",
      "POST /payout/cbe | /awash | /dashen | /telebirr",
    ],
  });
});
