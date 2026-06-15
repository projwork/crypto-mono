import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { sendOk } from "../../lib/apiResponse.js";
import { fxService } from "../fx/fx.service.js";
import {
  blockchainConfirmSchema,
  payoutSchema,
  swissDepositSchema,
  swissWithdrawSchema,
} from "./mock.schemas.js";
import { confirmBlockchainDeposit } from "./mock.blockchain.service.js";
import {
  getSwissBalance,
  swissDepositConfirmation,
  swissWithdraw,
} from "./mock.swiss.service.js";
import { processPayout, type PayoutBank } from "./mock.payout.service.js";

/**
 * Mock external APIs — Modules 5 & 7.
 * PRD-shaped mock responses are returned directly (no API envelope) to match external API specs.
 */
export const mockRouter = Router();

const isFailMode = (value: unknown): boolean =>
  value === "true" || value === "1";

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

mockRouter.post(
  "/blockchain/confirm",
  asyncHandler(async (req, res) => {
    const input = blockchainConfirmSchema.parse(req.body);
    const result = await confirmBlockchainDeposit(input);
    res.json(result);
  }),
);

mockRouter.post(
  "/swiss/deposit-confirmation",
  asyncHandler(async (req, res) => {
    const input = swissDepositSchema.parse(req.body);
    const result = await swissDepositConfirmation(input);
    res.json(result);
  }),
);

mockRouter.get(
  "/swiss/balance",
  asyncHandler(async (_req, res) => {
    const result = await getSwissBalance();
    res.json(result);
  }),
);

mockRouter.post(
  "/swiss/withdraw",
  asyncHandler(async (req, res) => {
    const input = swissWithdrawSchema.parse(req.body);
    const result = await swissWithdraw(input);
    res.json(result);
  }),
);

const payoutHandler = (bank: PayoutBank) =>
  asyncHandler(async (req, res) => {
    const input = payoutSchema.parse(req.body);
    const result = processPayout(bank, input, isFailMode(req.query.fail));
    res.json(result);
  });

mockRouter.post("/payout/cbe", payoutHandler("cbe"));
mockRouter.post("/payout/awash", payoutHandler("awash"));
mockRouter.post("/payout/dashen", payoutHandler("dashen"));
mockRouter.post("/payout/telebirr", payoutHandler("telebirr"));

mockRouter.get("/", (_req, res) => {
  sendOk(res, {
    module: "mock",
    endpoints: [
      "GET /fx-rate",
      "POST /blockchain/confirm",
      "POST /swiss/deposit-confirmation",
      "GET /swiss/balance",
      "POST /swiss/withdraw",
      "POST /payout/cbe | /awash | /dashen | /telebirr (?fail=true for demo failures)",
    ],
  });
});
