import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { User } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../lib/apiResponse.js";
import {
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "./auth.tokens.js";
import type { LoginInput, RegisterInput } from "./auth.schemas.js";

const BCRYPT_ROUNDS = 10;

/** Public-safe view of a user (never exposes passwordHash). */
export const toPublicUser = (user: User) => ({
  id: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  phone: user.phone,
  country: user.country,
  role: user.role,
  kycTier: user.kycTier,
  kycStatus: user.kycStatus,
  createdAt: user.createdAt,
});

export type PublicUser = ReturnType<typeof toPublicUser>;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/** Persist a refresh token (hashed) with its real expiry read from the JWT. */
const persistRefreshToken = async (userId: string, token: string): Promise<void> => {
  const decoded = jwt.decode(token) as { exp?: number } | null;
  const expiresAt = decoded?.exp
    ? new Date(decoded.exp * 1000)
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: { userId, tokenHash: hashToken(token), expiresAt },
  });
};

const issueTokens = async (user: User): Promise<AuthTokens> => {
  const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });
  const { token: refreshToken } = signRefreshToken(user.id);
  await persistRefreshToken(user.id, refreshToken);
  return { accessToken, refreshToken };
};

export const registerUser = async (
  input: RegisterInput,
): Promise<{ user: PublicUser; tokens: AuthTokens }> => {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw AppError.conflict("An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      country: input.country,
      passwordHash,
    },
  });

  const tokens = await issueTokens(user);
  return { user: toPublicUser(user), tokens };
};

export const loginUser = async (
  input: LoginInput,
): Promise<{ user: PublicUser; tokens: AuthTokens }> => {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    throw AppError.unauthorized("Invalid email or password");
  }

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    throw AppError.unauthorized("Invalid email or password");
  }

  const tokens = await issueTokens(user);
  return { user: toPublicUser(user), tokens };
};

/** Validate + rotate a refresh token, returning a fresh token pair. */
export const refreshTokens = async (refreshToken: string): Promise<AuthTokens> => {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw AppError.unauthorized("Invalid or expired refresh token");
  }

  const tokenHash = hashToken(refreshToken);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw AppError.unauthorized("Refresh token is no longer valid");
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) {
    throw AppError.unauthorized("User no longer exists");
  }

  // Rotate: revoke the used token, then issue a new pair.
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  return issueTokens(user);
};

/** Revoke a refresh token (logout). Idempotent. */
export const logout = async (refreshToken: string): Promise<void> => {
  const tokenHash = hashToken(refreshToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
};

export const getUserById = async (userId: string): Promise<PublicUser> => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw AppError.notFound("User not found");
  }
  return toPublicUser(user);
};
