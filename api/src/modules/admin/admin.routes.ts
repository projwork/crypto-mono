import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { authMiddleware, requireRole } from "../../middleware/auth.js";
import { sendOk } from "../../lib/apiResponse.js";
import { logEvent, listAuditEntries } from "../audit/audit.service.js";
import { updateFxRateSchema } from "../fx/fx.schemas.js";
import { fxService } from "../fx/fx.service.js";
import { getAdminStats } from "./admin.stats.service.js";
import {
  adminOverrideTransferSchema,
  adminTransferListSchema,
  adminUserListSchema,
  liquidityTopupSchema,
  sweepCryptoSchema,
  broadcastNotificationSchema,
} from "./admin.schemas.js";
import {
  getAdminTransfer,
  listAdminTransfers,
  overrideFailedTransfer,
} from "./admin.transfers.service.js";
import {
  getAdminUser,
  listAdminUsers,
  getHotWalletBalance,
  getBlockchainTransactions,
  sweepCrypto,
  broadcastNotification,
  getSystemHealth,
} from "./admin.service.js";
import {
  topupChfLiquidity,
  topupEtbLiquidity,
  getLiquidityLedger,
} from "../liquidity/liquidity.service.js";

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
    await logEvent({
      actorId: req.user!.id,
      action: "ADMIN_FX_RATE_UPDATE",
      entityType: "ExchangeRate",
      metadata: {
        usdToEtb: rate.usdToEtb,
        chfToEtb: rate.chfToEtb,
        source: rate.source,
      },
    });
    sendOk(res, {
      usdToEtb: rate.usdToEtb,
      chfToEtb: rate.chfToEtb,
      timestamp: rate.timestamp.toISOString(),
      source: rate.source,
    }, 201);
  }),
);

adminRouter.get(
  "/transfers",
  asyncHandler(async (req, res) => {
    const filters = adminTransferListSchema.parse(req.query);
    const transfers = await listAdminTransfers(filters);
    sendOk(res, { transfers });
  }),
);

adminRouter.get(
  "/transfers/:id",
  asyncHandler(async (req, res) => {
    const transfer = await getAdminTransfer(req.params.id);
    sendOk(res, { transfer });
  }),
);

adminRouter.post(
  "/transfers/:id/override",
  asyncHandler(async (req, res) => {
    const input = adminOverrideTransferSchema.parse(req.body);
    const transfer = await overrideFailedTransfer(req.user!.id, req.params.id, input);
    sendOk(res, { transfer });
  }),
);

adminRouter.get(
  "/stats",
  asyncHandler(async (_req, res) => {
    const stats = await getAdminStats();
    sendOk(res, { stats });
  }),
);

adminRouter.get(
  "/audit",
  asyncHandler(async (req, res) => {
    const limit = req.query.limit ? Number(req.query.limit) : 100;
    const audit = await listAuditEntries({
      entityType: typeof req.query.entityType === "string" ? req.query.entityType : undefined,
      transferId: typeof req.query.transferId === "string" ? req.query.transferId : undefined,
      actorId: typeof req.query.actorId === "string" ? req.query.actorId : undefined,
      action: typeof req.query.action === "string" ? req.query.action : undefined,
      limit: Number.isFinite(limit) ? limit : 100,
    });
    sendOk(res, { audit });
  }),
);

// --- User management -------------------------------------------------------

adminRouter.get(
  "/users",
  asyncHandler(async (req, res) => {
    const filters = adminUserListSchema.parse(req.query);
    const users = await listAdminUsers(filters);
    sendOk(res, { users });
  }),
);

adminRouter.get(
  "/users/:id",
  asyncHandler(async (req, res) => {
    const userData = await getAdminUser(req.params.id);
    sendOk(res, userData);
  }),
);

adminRouter.post(
  "/liquidity/chf/topup",
  asyncHandler(async (req, res) => {
    const input = liquidityTopupSchema.parse(req.body);
    const result = await topupChfLiquidity(input.amount, input.reference);
    await logEvent({
      actorId: req.user!.id,
      action: "ADMIN_LIQUIDITY_TOPUP_CHF",
      entityType: "LiquidityPool",
      metadata: input,
    });
    sendOk(res, result);
  }),
);

adminRouter.post(
  "/liquidity/etb/topup",
  asyncHandler(async (req, res) => {
    const input = liquidityTopupSchema.parse(req.body);
    const result = await topupEtbLiquidity(input.amount, input.reference);
    await logEvent({
      actorId: req.user!.id,
      action: "ADMIN_LIQUIDITY_TOPUP_ETB",
      entityType: "LiquidityPool",
      metadata: input,
    });
    sendOk(res, result);
  }),
);

adminRouter.get(
  "/liquidity/history",
  asyncHandler(async (_req, res) => {
    const history = await getLiquidityLedger();
    sendOk(res, { data: history });
  }),
);

adminRouter.get(
  "/treasury/hot-wallet",
  asyncHandler(async (_req, res) => {
    const wallet = await getHotWalletBalance();
    sendOk(res, wallet);
  }),
);

adminRouter.get(
  "/treasury/blockchain-transactions",
  asyncHandler(async (_req, res) => {
    const txns = await getBlockchainTransactions();
    sendOk(res, { data: txns });
  }),
);

adminRouter.post(
  "/treasury/sweep",
  asyncHandler(async (req, res) => {
    const input = sweepCryptoSchema.parse(req.body);
    const result = await sweepCrypto(req.user!.id, input.asset, input.amount);
    sendOk(res, result);
  }),
);

adminRouter.get(
  "/audit-logs",
  asyncHandler(async (req, res) => {
    const limit = req.query.limit ? Number(req.query.limit) : 100;
    const audit = await listAuditEntries({
      entityType: typeof req.query.entity === "string" ? req.query.entity : undefined,
      limit: Number.isFinite(limit) ? limit : 100,
    });
    // Format for user's request
    const formatted = audit.map((entry) => ({
      id: entry.id,
      adminId: entry.actorId,
      action: entry.action,
      entityId: entry.entityId,
      createdAt: entry.createdAt.toISOString(),
    }));
    sendOk(res, { data: formatted });
  }),
);

adminRouter.post(
  "/notifications/broadcast",
  asyncHandler(async (req, res) => {
    const input = broadcastNotificationSchema.parse(req.body);
    const result = await broadcastNotification(req.user!.id, input.title, input.message);
    sendOk(res, result);
  }),
);

adminRouter.get(
  "/system/health",
  asyncHandler(async (_req, res) => {
    const health = await getSystemHealth();
    sendOk(res, health);
  }),
);

adminRouter.get("/", (_req, res) => {
  sendOk(res, {
    module: "admin",
    endpoints: [
      "GET /stats",
      "GET /users",
      "GET /users/:id",
      "GET /transfers",
      "POST /transfers/:id/override",
      "POST /fx-rate",
      "GET /audit",
    ],
  });
});
