import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { authMiddleware } from "../../middleware/auth.js";
import { sendOk } from "../../lib/apiResponse.js";
import {
  createBeneficiarySchema,
  updateBeneficiarySchema,
} from "./beneficiaries.schemas.js";
import {
  createBeneficiary,
  deleteBeneficiary,
  getBeneficiary,
  listBeneficiaries,
  toggleFavoriteBeneficiary,
  updateBeneficiary,
} from "./beneficiaries.service.js";

/**
 * Beneficiary directory module — Module 4.
 * POST /, GET /, GET /:id, PUT /:id, DELETE /:id, POST /:id/favorite.
 */
export const beneficiariesRouter = Router();

beneficiariesRouter.use(authMiddleware);

beneficiariesRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = createBeneficiarySchema.parse(req.body);
    const beneficiary = await createBeneficiary(req.user!.id, input);
    sendOk(res, { beneficiary }, 201);
  }),
);

beneficiariesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const beneficiaries = await listBeneficiaries(req.user!.id);
    sendOk(res, { beneficiaries });
  }),
);

beneficiariesRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const beneficiary = await getBeneficiary(req.user!.id, req.params.id);
    sendOk(res, { beneficiary });
  }),
);

beneficiariesRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const input = updateBeneficiarySchema.parse(req.body);
    const beneficiary = await updateBeneficiary(req.user!.id, req.params.id, input);
    sendOk(res, { beneficiary });
  }),
);

beneficiariesRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await deleteBeneficiary(req.user!.id, req.params.id);
    sendOk(res, { deleted: true });
  }),
);

beneficiariesRouter.post(
  "/:id/favorite",
  asyncHandler(async (req, res) => {
    const beneficiary = await toggleFavoriteBeneficiary(req.user!.id, req.params.id);
    sendOk(res, { beneficiary });
  }),
);
