import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import type { Role } from "@prisma/client";
import { config } from "../../config/index.js";

/** Claims encoded in the access token. */
export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: Role;
  type: "access";
}

/** Claims encoded in the refresh token. */
export interface RefreshTokenPayload {
  sub: string;
  jti: string;
  type: "refresh";
}

type ExpiresIn = jwt.SignOptions["expiresIn"];

export const signAccessToken = (payload: Omit<AccessTokenPayload, "type">): string =>
  jwt.sign({ ...payload, type: "access" }, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessTtl as ExpiresIn,
  });

export const signRefreshToken = (userId: string): { token: string; jti: string } => {
  const jti = crypto.randomUUID();
  const token = jwt.sign({ sub: userId, jti, type: "refresh" }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshTtl as ExpiresIn,
  });
  return { token, jti };
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  const decoded = jwt.verify(token, config.jwt.accessSecret) as AccessTokenPayload;
  if (decoded.type !== "access") {
    throw new jwt.JsonWebTokenError("Invalid token type");
  }
  return decoded;
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  const decoded = jwt.verify(token, config.jwt.refreshSecret) as RefreshTokenPayload;
  if (decoded.type !== "refresh") {
    throw new jwt.JsonWebTokenError("Invalid token type");
  }
  return decoded;
};

/** Hash a refresh token for at-rest storage (never store the raw token). */
export const hashToken = (token: string): string =>
  crypto.createHash("sha256").update(token).digest("hex");
