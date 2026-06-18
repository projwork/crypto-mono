import { Router } from "express";
import { sendOk } from "../lib/apiResponse.js";
import { authRouter } from "../modules/auth/auth.routes.js";
import { kycRouter } from "../modules/kyc/kyc.routes.js";
import { beneficiariesRouter } from "../modules/beneficiaries/beneficiaries.routes.js";
import { walletRouter } from "../modules/wallet/wallet.routes.js";
import { conversionsRouter } from "../modules/conversions/conversions.routes.js";
import { transfersRouter } from "../modules/transfers/transfers.routes.js";
import { liquidityRouter } from "../modules/liquidity/liquidity.routes.js";
import { notificationsRouter } from "../modules/notifications/notifications.routes.js";
import { adminRouter } from "../modules/admin/admin.routes.js";
import { mockRouter } from "../modules/mock/mock.routes.js";

/**
 * Central API router. Every module is mounted under its prefix here.
 * Route prefixes are part of the shared contract — keep them in sync with CONTRACTS.md.
 */
export const apiRouter = Router();

apiRouter.get("/", (_req, res) => {
  sendOk(res, {
    name: "crypto-remittance-api",
    version: "0.1.0",
    modules: [
      "/api/auth",
      "/api/kyc",
      "/api/beneficiaries",
      "/api/wallet",
      "/api/conversions",
      "/api/transfers",
      "/api/liquidity",
      "/api/notifications",
      "/api/admin",
      "/api/mock",
    ],
  });
});

apiRouter.use("/auth", authRouter);
apiRouter.use("/kyc", kycRouter);
apiRouter.use("/beneficiaries", beneficiariesRouter);
apiRouter.use("/wallet", walletRouter);
apiRouter.use("/conversions", conversionsRouter);
apiRouter.use("/transfers", transfersRouter);
apiRouter.use("/liquidity", liquidityRouter);
apiRouter.use("/notifications", notificationsRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/mock", mockRouter);
