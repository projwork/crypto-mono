import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { authMiddleware } from "../../middleware/auth.js";
import { sendOk } from "../../lib/apiResponse.js";
import { getTransferTimeline } from "../audit/audit.service.js";
import {
  createTransferSchema,
  transferQuoteSchema,
} from "./transfers.schemas.js";
import {
  createTransfer,
  getTransferById,
  listMyTransfers,
  quoteTransfer,
  confirmWallet,
  getReceipt,
  getPayout,
} from "./transfers.service.js";
import { simulateDeposit, continueTransferPayout } from "./transfers.orchestrator.js";
import { generateReceiptPdf } from "./transfers.receipt.pdf.js";
import {
  transferStatusBus,
  type TransferStatusEvent,
} from "./transfers.events.js";

/**
 * Transfers module — Modules 8 & 9.
 */
export const transfersRouter = Router();

/** Supports Bearer header or `?accessToken=` for SSE (EventSource) clients. */
const authWithQueryToken = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.headers.authorization && typeof req.query.accessToken === "string") {
    req.headers.authorization = `Bearer ${req.query.accessToken}`;
  }
  return authMiddleware(req, res, next);
};

transfersRouter.use(authWithQueryToken);

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
  "/:id/timeline",
  asyncHandler(async (req, res) => {
    await getTransferById(req.user!.id, req.params.id);
    const timeline = await getTransferTimeline(req.params.id);
    sendOk(res, {
      timeline: timeline.map((entry) => ({
        id: entry.id,
        action: entry.action,
        entityType: entry.entityType,
        metadata: entry.metadata,
        createdAt: entry.createdAt,
      })),
    });
  }),
);

transfersRouter.get(
  "/:id/events",
  asyncHandler(async (req, res) => {
    const transfer = await getTransferById(req.user!.id, req.params.id);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    const sendEvent = (event: TransferStatusEvent) => {
      if (event.transferId !== transfer.id) {
        return;
      }
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    const initial: TransferStatusEvent = {
      transferId: transfer.id,
      reference: transfer.reference,
      status: transfer.status as TransferStatusEvent["status"],
      timestamp: new Date().toISOString(),
    };
    res.write(`data: ${JSON.stringify(initial)}\n\n`);

    transferStatusBus.on(`transfer:${transfer.id}`, sendEvent);

    req.on("close", () => {
      transferStatusBus.off(`transfer:${transfer.id}`, sendEvent);
    });
  }),
);

transfersRouter.post(
  "/:id/simulate-deposit",
  asyncHandler(async (req, res) => {
    const transfer = await simulateDeposit(req.user!.id, req.params.id);
    sendOk(res, { transfer });
  }),
);

transfersRouter.post(
  "/:id/continue-payout",
  asyncHandler(async (req, res) => {
    const transfer = await continueTransferPayout(req.user!.id, req.params.id);
    sendOk(res, { transfer });
  }),
);

transfersRouter.get(
  "/:id/receipt.pdf",
  asyncHandler(async (req, res) => {
    const pdf = await generateReceiptPdf(req.user!.id, req.params.id);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="receipt-${req.params.id}.pdf"`,
    );
    res.send(pdf);
  }),
);

transfersRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const transfer = await getTransferById(req.user!.id, req.params.id);
    sendOk(res, { transfer });
  }),
);

// --- New Endpoints ---
transfersRouter.post(
  "/:id/confirm-wallet",
  asyncHandler(async (req, res) => {
    const result = await confirmWallet(req.user!.id, req.params.id);
    sendOk(res, result);
  }),
);

transfersRouter.get(
  "/:id/receipt",
  asyncHandler(async (req, res) => {
    const receipt = await getReceipt(req.user!.id, req.params.id);
    sendOk(res, { receipt });
  }),
);

transfersRouter.get(
  "/:id/payout",
  asyncHandler(async (req, res) => {
    const payout = await getPayout(req.user!.id, req.params.id);
    sendOk(res, { payout });
  }),
);
