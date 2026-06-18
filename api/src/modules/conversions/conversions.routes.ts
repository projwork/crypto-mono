import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { authMiddleware } from "../../middleware/auth.js";
import { sendOk } from "../../lib/apiResponse.js";
import { fxService } from "../fx/fx.service.js";
import { reserveChf, reserveEtb } from "../liquidity/liquidity.service.js";
import { cryptoToChfSchema, chfToEtbSchema } from "../fx/fx.schemas.js";

export const conversionsRouter = Router();
conversionsRouter.use(authMiddleware);

// POST /api/conversions/crypto-to-chf
conversionsRouter.post(
  "/crypto-to-chf",
  asyncHandler(async (req, res) => {
    const input = cryptoToChfSchema.parse(req.body);
    const conversion = await fxService.convertCryptoToChf({
      asset: input.asset,
      cryptoAmount: input.cryptoAmount,
    });
    await reserveChf(conversion.chfAmount, input.transferId);
    sendOk(res, conversion);
  })
);

// GET /api/conversions/crypto-to-chf/rate
conversionsRouter.get(
  "/crypto-to-chf/rate",
  asyncHandler(async (req, res) => {
    const asset = req.query.asset as string;
    const rate = await fxService.getCryptoToChfRate(asset);
    sendOk(res, rate);
  })
);

// POST /api/conversions/chf-to-etb
conversionsRouter.post(
  "/chf-to-etb",
  asyncHandler(async (req, res) => {
    const input = chfToEtbSchema.parse(req.body);
    const conversion = await fxService.convertChfToEtb({
      chfAmount: input.chfAmount,
    });
    await reserveEtb(conversion.etbAmount, input.transferId);
    sendOk(res, conversion);
  })
);

// GET /api/conversions/chf-to-etb/rate
conversionsRouter.get(
  "/chf-to-etb/rate",
  asyncHandler(async (req, res) => {
    const rate = await fxService.getChfToEtbRate();
    sendOk(res, rate);
  })
);
