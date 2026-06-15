import { Router, type NextFunction, type Request, type Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { authMiddleware, requireRole } from "../../middleware/auth.js";
import { AppError, sendOk } from "../../lib/apiResponse.js";
import { kycUpload, kycFileUrl } from "./kyc.upload.js";
import { chooseTierSchema, rejectKycSchema, submitKycSchema } from "./kyc.schemas.js";
import {
  approveKyc,
  chooseTier,
  getMyKyc,
  type KycFileUrls,
  listPendingKyc,
  rejectKyc,
  submitKyc,
} from "./kyc.service.js";

/**
 * KYC module — Module 3.
 * User: POST /submit, GET /status, POST /tier.
 * Admin: GET /pending, POST /:id/approve, POST /:id/reject.
 */
export const kycRouter = Router();

const uploadFields = kycUpload.fields([
  { name: "passport", maxCount: 1 },
  { name: "nationalId", maxCount: 1 },
  { name: "selfie", maxCount: 1 },
]);

/** Runs multer and converts upload errors into 400 envelopes. */
const handleKycUpload = (req: Request, res: Response, next: NextFunction) => {
  uploadFields(req, res, (err: unknown) => {
    if (err) {
      next(AppError.badRequest(err instanceof Error ? err.message : "File upload failed"));
      return;
    }
    next();
  });
};

const resolveFileUrls = (req: Request): KycFileUrls => {
  const files = req.files as Record<string, Express.Multer.File[]> | undefined;
  const pick = (field: string) =>
    files?.[field]?.[0] ? kycFileUrl(files[field][0].filename) : undefined;

  return {
    passportUrl: pick("passport"),
    nationalIdUrl: pick("nationalId"),
    selfieUrl: pick("selfie"),
  };
};

kycRouter.post(
  "/submit",
  authMiddleware,
  handleKycUpload,
  asyncHandler(async (req, res) => {
    const input = submitKycSchema.parse(req.body);
    const fileUrls = resolveFileUrls(req);
    const verification = await submitKyc(req.user!.id, input, fileUrls);
    sendOk(res, { verification }, 201);
  }),
);

kycRouter.get(
  "/status",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const status = await getMyKyc(req.user!.id);
    sendOk(res, status);
  }),
);

kycRouter.post(
  "/tier",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { tier } = chooseTierSchema.parse(req.body);
    const verification = await chooseTier(req.user!.id, tier);
    sendOk(res, { verification });
  }),
);

// --- Admin (manual approval, PRD §11 prototype) ----------------------------

kycRouter.get(
  "/pending",
  authMiddleware,
  requireRole("ADMIN"),
  asyncHandler(async (_req, res) => {
    const pending = await listPendingKyc();
    sendOk(res, { pending });
  }),
);

kycRouter.post(
  "/:id/approve",
  authMiddleware,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const verification = await approveKyc(req.user!.id, req.params.id);
    sendOk(res, { verification });
  }),
);

kycRouter.post(
  "/:id/reject",
  authMiddleware,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const { reason } = rejectKycSchema.parse(req.body);
    const verification = await rejectKyc(req.user!.id, req.params.id, reason);
    sendOk(res, { verification });
  }),
);
