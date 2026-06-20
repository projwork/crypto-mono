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

export interface PublicKycVerification {
  id: string;
  tier: KycTier;
  status: KycStatus;
  passportUrl: string | null;
  nationalIdUrl: string | null;
  selfieUrl: string | null;
  proofOfAddressUrl: string | null;
  sourceOfFunds: string | null;
  rejectionReason: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface TransferLimit {
  tier: KycTier;
  kycStatus: KycStatus;
  unlimited: boolean;
  limitUsd: number | null;
  usedUsd: number;
  remainingUsd: number | null;
}

export interface TierInfo {
  tier: KycTier;
  monthlyLimitUsd: number | null;
  requirements: string[];
}

export interface KycStatusResponse {
  verification: PublicKycVerification | null;
  /** Pending or rejected tier upgrade / first application when user remains approved at current tier. */
  latestApplication?: PublicKycVerification | null;
  tier: KycTier;
  status: KycStatus;
  limit: TransferLimit;
  tiers: TierInfo[];
}

export interface SubmitKycPayload {
  tier?: KycTier;
  proofOfAddressUrl?: string;
  sourceOfFunds?: string;
  passport?: File;
  nationalId?: File;
  selfie?: File;
  passportUrl?: string;
  nationalIdUrl?: string;
  selfieUrl?: string;
}

export interface PublicBeneficiary {
  id: string;
  fullName: string;
  country: string;
  payoutMethod: PayoutMethod;
  bank: BankName | null;
  accountNumber: string | null;
  phoneNumber: string | null;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBeneficiaryPayload {
  fullName: string;
  country?: string;
  payoutMethod: PayoutMethod;
  bank?: BankName;
  accountNumber?: string;
  phoneNumber?: string;
}

export type UpdateBeneficiaryPayload = Partial<CreateBeneficiaryPayload>;

export interface TransferQuote {
  asset: AssetType;
  amount: number;
  beneficiaryId: string;
  usdValue: number;
  usdToEtb: number;
  grossEtb: number;
  feeCrypto: number;
  feeEtb: number;
  payoutEtb: number;
  rateTimestamp: string;
  rateSource?: string;
}

export interface TransferQuotePayload {
  asset: AssetType;
  amount: number;
  beneficiaryId: string;
}

export interface CryptoToChfRate {
  asset: AssetType;
  usdRate: number;
  usdToChf: number;
  chfRate: number;
  source: string;
  fetchedAt: string;
}

export interface ChfToEtbRate {
  from: "CHF";
  to: "ETB";
  rate: number;
  usdToChf: number;
  usdToEtb: number;
  source: string;
  fetchedAt: string;
}

export interface DepositAddress {
  id: string;
  transferId: string;
  asset: AssetType;
  address: string;
  createdAt: string;
}

export interface DepositInstructions {
  transferId: string;
  reference: string;
  asset: AssetType;
  address: string;
  expectedAmount: string;
  network: string;
}

export interface PublicTransfer {
  id: string;
  reference: string;
  status: TransferStatus;
  asset: AssetType;
  sendAmount: string;
  feeCrypto: string;
  usdValue: string;
  usdToEtb: string;
  grossEtb: string;
  feeEtb: string;
  payoutEtb: string;
  txHash: string | null;
  swissReference: string | null;
  payoutReference: string | null;
  failureReason: string | null;
  rateTimestamp: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  beneficiary: PublicBeneficiary;
  depositAddress: DepositAddress | null;
}

export interface TransferStatusEvent {
  transferId: string;
  reference: string;
  status: TransferStatus;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface TimelineEntry {
  id: string;
  action: string;
  entityType: string;
  metadata: unknown;
  createdAt: string;
}

export interface UserNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  transferId?: string | null;
  isRead: boolean;
  createdAt: string;
}
