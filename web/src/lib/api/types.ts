/** Mirrors the backend standard response envelope (see CONTRACTS.md). */
export interface SuccessEnvelope<T> {
  success: true;
  data: T;
}

export interface ErrorEnvelope {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiEnvelope<T> = SuccessEnvelope<T> | ErrorEnvelope;

export type Role = "SENDER" | "ADMIN";
export type KycTier = "TIER_1" | "TIER_2" | "TIER_3";
export type KycStatus = "PENDING" | "APPROVED" | "REJECTED";
export type AssetType = "USDC" | "USDT" | "ETH";
export type PayoutMethod = "BANK" | "TELEBIRR";
export type BankName = "CBE" | "AWASH" | "DASHEN";

export type TransferStatus =
  | "INITIATED"
  | "AWAITING_CRYPTO"
  | "BLOCKCHAIN_PENDING"
  | "BLOCKCHAIN_CONFIRMED"
  | "SWISS_FUNDS_RECEIVED"
  | "FX_CONVERTED"
  | "PAYOUT_PROCESSING"
  | "PAYOUT_SENT"
  | "COMPLETED"
  | "FAILED"
  | "REVERSED"
  | "EXPIRED";

export interface PublicUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  role: Role;
  kycTier: KycTier;
  kycStatus: KycStatus;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: PublicUser;
  tokens: AuthTokens;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}
