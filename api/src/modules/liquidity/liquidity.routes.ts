import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { authMiddleware, requireRole } from "../../middleware/auth.js";
import { sendOk } from "../../lib/apiResponse.js";
import { getLiquidityLedger, getPoolsSnapshot } from "./liquidity.service.js";

/**
 * Liquidity management module — Module 10.
 * GET /pools, GET /ledger (admin-only).
 */
export const liquidityRouter = Router();

liquidityRouter.use(authMiddleware, requireRole("ADMIN"));

liquidityRouter.get(
  "/pools",
  asyncHandler(async (_req, res) => {
    const snapshot = await getPoolsSnapshot();
    sendOk(res, snapshot);
  }),
);

liquidityRouter.get(
  "/ledger",
  asyncHandler(async (req, res) => {
    const limit = req.query.limit ? Number(req.query.limit) : 100;
    const ledger = await getLiquidityLedger(Number.isFinite(limit) ? limit : 100);
    sendOk(res, { ledger });
  }),
);
