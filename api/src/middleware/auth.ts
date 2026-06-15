import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { Role } from "@prisma/client";
import { AppError } from "../lib/apiResponse.js";
import { verifyAccessToken } from "../modules/auth/auth.tokens.js";

/**
 * Verifies the Bearer access token and attaches `req.user`.
 * Other modules import this to protect their routes.
 *
 * Header format: `Authorization: Bearer <accessToken>`
 */
export const authMiddleware: RequestHandler = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    throw AppError.unauthorized("Missing or malformed Authorization header");
  }

  const token = header.slice("Bearer ".length).trim();

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    next();
  } catch {
    throw AppError.unauthorized("Invalid or expired access token");
  }
};

/**
 * RBAC guard. Use after authMiddleware, e.g. `requireRole("ADMIN")`.
 * Accepts one or more allowed roles.
 */
export const requireRole =
  (...roles: Role[]): RequestHandler =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw AppError.unauthorized();
    }
    if (!roles.includes(req.user.role)) {
      throw AppError.forbidden("You do not have permission to access this resource");
    }
    next();
  };
