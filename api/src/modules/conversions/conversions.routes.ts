import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { authMiddleware } from "../../middleware/auth.js";
import { sendOk } from "../../lib/apiResponse.js";
import {
  chfToEtbSchema,
  cryptoToChfRateSchema,
  cryptoToChfSchema,
} from "./conversions.schemas.js";
import {
  convertChfToEtb,
  convertCryptoToChf,
  getChfToEtbRate,
  getCryptoToChfRate,
} from "./conversions.service.js";

/**
 * Conversion module.
 * Public rate reads; authenticated conversion writes tied to a transfer.
 */
export const conversionsRouter = Router();

conversionsRouter.get(
  "/crypto-to-chf/rate",
  asyncHandler(async (req, res) => {
    const { asset } = cryptoToChfRateSchema.parse(req.query);
    const rate = await getCryptoToChfRate(asset);
    sendOk(res, rate);
  }),
);

conversionsRouter.get(
  "/chf-to-etb/rate",
  asyncHandler(async (_req, res) => {
    const rate = await getChfToEtbRate();
    sendOk(res, rate);
  }),
);

conversionsRouter.post(
  "/crypto-to-chf",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const input = cryptoToChfSchema.parse(req.body);
    const conversion = await convertCryptoToChf(req.user!, input);
    sendOk(res, conversion);
  }),
);

conversionsRouter.post(
  "/chf-to-etb",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const input = chfToEtbSchema.parse(req.body);
    const conversion = await convertChfToEtb(req.user!, input);
    sendOk(res, conversion);
  }),
);

conversionsRouter.get("/", (_req, res) => {
  sendOk(res, {
    module: "conversions",
    endpoints: [
      "GET /crypto-to-chf/rate?asset=USDC",
      "POST /crypto-to-chf",
      "GET /chf-to-etb/rate",
      "POST /chf-to-etb",
    ],
  });
});
