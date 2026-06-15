import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { authMiddleware } from "../../middleware/auth.js";
import { sendOk } from "../../lib/apiResponse.js";
import { loginSchema, refreshSchema, registerSchema } from "./auth.schemas.js";
import {
  getUserById,
  loginUser,
  logout,
  refreshTokens,
  registerUser,
} from "./auth.service.js";

/**
 * Auth module — Module 2.
 * POST /register, POST /login, POST /refresh, POST /logout, GET /me.
 */
export const authRouter = Router();

authRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    const input = registerSchema.parse(req.body);
    const result = await registerUser(input);
    sendOk(res, result, 201);
  }),
);

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const input = loginSchema.parse(req.body);
    const result = await loginUser(input);
    sendOk(res, result);
  }),
);

authRouter.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const { refreshToken } = refreshSchema.parse(req.body);
    const tokens = await refreshTokens(refreshToken);
    sendOk(res, tokens);
  }),
);

authRouter.post(
  "/logout",
  asyncHandler(async (req, res) => {
    const { refreshToken } = refreshSchema.parse(req.body);
    await logout(refreshToken);
    sendOk(res, { loggedOut: true });
  }),
);

authRouter.get(
  "/me",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const user = await getUserById(req.user!.id);
    sendOk(res, { user });
  }),
);
