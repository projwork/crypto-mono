import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { authMiddleware } from "../../middleware/auth.js";
import { sendOk } from "../../lib/apiResponse.js";
import { depositAddressSchema } from "./wallet.schemas.js";
import {
  getDepositInstructions,
  getOrCreateDepositAddress,
} from "./wallet.service.js";

/**
 * Wallet & crypto deposit module — Module 6.
 * POST /deposit-address, GET /transfers/:transferId/deposit-instructions.
 */
export const walletRouter = Router();

walletRouter.use(authMiddleware);

walletRouter.post(
  "/deposit-address",
  asyncHandler(async (req, res) => {
    const { transferId, asset } = depositAddressSchema.parse(req.body);
    const { depositAddress, created } = await getOrCreateDepositAddress(
      req.user!.id,
      transferId,
      asset,
    );
    sendOk(res, { depositAddress }, created ? 201 : 200);
  }),
);

walletRouter.get(
  "/transfers/:transferId/deposit-instructions",
  asyncHandler(async (req, res) => {
    const instructions = await getDepositInstructions(req.user!.id, req.params.transferId);
    sendOk(res, { instructions });
  }),
);
