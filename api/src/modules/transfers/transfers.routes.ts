import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { authMiddleware } from "../../middleware/auth.js";
import { sendOk } from "../../lib/apiResponse.js";
import { createTransferSchema, transferQuoteSchema } from "./transfers.schemas.js";
import {
  createTransfer,
  getTransferById,
  listMyTransfers,
  quoteTransfer,
} from "./transfers.service.js";

/**
 * Transfers module — Modules 8 & 9.
 * POST /quote, POST /, GET /, GET /:id.
 */
export const transfersRouter = Router();

transfersRouter.use(authMiddleware);

transfersRouter.post(
  "/quote",
  asyncHandler(async (req, res) => {
    const input = transferQuoteSchema.parse(req.body);
    const quote = await quoteTransfer(req.user!.id, input);
    sendOk(res, { quote });
  }),
);

transfersRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = createTransferSchema.parse(req.body);
    const transfer = await createTransfer(req.user!.id, input);
    sendOk(res, { transfer }, 201);
  }),
);

transfersRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const transfers = await listMyTransfers(req.user!.id);
    sendOk(res, { transfers });
  }),
);

transfersRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const transfer = await getTransferById(req.user!.id, req.params.id);
    sendOk(res, { transfer });
  }),
);
