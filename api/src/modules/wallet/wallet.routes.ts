import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { authMiddleware } from "../../middleware/auth.js";
import { sendOk } from "../../lib/apiResponse.js";
import { depositAddressSchema, connectWalletSchema } from "./wallet.schemas.js";
import {
  getDepositInstructions,
  getOrCreateDepositAddress,
  connectWallet,
  getMyWallet,
  disconnectWallet,
} from "./wallet.service.js";

/**
 * Wallet & crypto deposit module — Module 6 + MetaMask connect/disconnect.
 */
export const walletRouter = Router();

walletRouter.use(authMiddleware);

// --- Connected Wallet Endpoints ---
walletRouter.post(
  "/connect",
  asyncHandler(async (req, res) => {
    const input = connectWalletSchema.parse(req.body);
    const wallet = await connectWallet(req.user!.id, input);
    sendOk(res, { wallet });
  }),
);

walletRouter.get(
  "/me",
  asyncHandler(async (req, res) => {
    const wallet = await getMyWallet(req.user!.id);
    sendOk(res, wallet);
  }),
);

walletRouter.post(
  "/disconnect",
  asyncHandler(async (req, res) => {
    const result = await disconnectWallet(req.user!.id);
    sendOk(res, result);
  }),
);

// --- Existing Wallet Endpoints ---
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
