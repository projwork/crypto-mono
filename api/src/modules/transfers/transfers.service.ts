import {
  AssetType,
  KycStatus,
  TransferStatus,
  type Beneficiary,
  type Transfer,
  type Wallet,
} from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../lib/apiResponse.js";
import { toPublicBeneficiary } from "../beneficiaries/beneficiaries.service.js";
import { fxService } from "../fx/fx.service.js";
import { getUserTransferLimit } from "../kyc/kyc.service.js";
import {
  getOrCreateDepositAddress,
  getMyWallets,
  toDepositAddress,
} from "../wallet/wallet.service.js";
import {
  computeUsdValue,
  getCryptoToUsd,
  getFeeCrypto,
  getTransferFeeMode,
} from "./transfers.pricing.js";
import type {
  CreateTransferInput,
  TransferQuoteInput,
} from "./transfers.schemas.js";

/** Full transfer quote — documented in CONTRACTS.md. */
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
}

export type PublicTransfer = ReturnType<typeof toPublicTransfer>;

const getOwnedBeneficiary = async (
  userId: string,
  beneficiaryId: string,
): Promise<Beneficiary> => {
  const beneficiary = await prisma.beneficiary.findFirst({
    where: { id: beneficiaryId, userId },
  });

  if (!beneficiary) {
    throw AppError.notFound("Beneficiary not found");
  }

  return beneficiary;
};

const buildQuote = async (
  userId: string,
  input: TransferQuoteInput,
): Promise<TransferQuote> => {
  await getOwnedBeneficiary(userId, input.beneficiaryId);

  const feeCrypto = getFeeCrypto(input.asset, input.amount);
  const fxQuote = await fxService.quote({
    cryptoAmount: input.amount,
    cryptoToUsd: getCryptoToUsd(input.asset),
    feeMode: getTransferFeeMode(input.asset, input.amount),
  });

  return {
    asset: input.asset,
    amount: input.amount,
    beneficiaryId: input.beneficiaryId,
    usdValue: computeUsdValue(input.asset, input.amount),
    usdToEtb: fxQuote.usdToEtb,
    grossEtb: fxQuote.grossEtb,
    feeCrypto,
    feeEtb: fxQuote.feeEtb,
    payoutEtb: fxQuote.payoutEtb,
    rateTimestamp: fxQuote.rateTimestamp,
  };
};

const generateReference = async (): Promise<string> => {
  const rows = await prisma.transfer.findMany({
    select: { reference: true },
    where: { reference: { startsWith: "TX" } },
  });

  let maxNum = 0;
  for (const row of rows) {
    const match = /^TX(\d+)$/.exec(row.reference);
    if (match) {
      maxNum = Math.max(maxNum, Number.parseInt(match[1], 10));
    }
  }

  return `TX${String(maxNum + 1).padStart(4, "0")}`;
};

const transferInclude = {
  beneficiary: true,
  wallet: true,
} as const;

type TransferWithRelations = Transfer & {
  beneficiary: Beneficiary;
  wallet: Wallet | null;
};

export const toPublicTransfer = (transfer: TransferWithRelations) => ({
  id: transfer.id,
  reference: transfer.reference,
  status: transfer.status,
  asset: transfer.asset,
  sendAmount: transfer.sendAmount.toString(),
  feeCrypto: transfer.feeCrypto.toString(),
  usdValue: transfer.usdValue.toString(),
  usdToEtb: transfer.usdToEtb.toString(),
  grossEtb: transfer.grossEtb.toString(),
  feeEtb: transfer.feeEtb.toString(),
  payoutEtb: transfer.payoutEtb.toString(),
  txHash: transfer.txHash,
  swissReference: transfer.swissReference,
  payoutReference: transfer.payoutReference,
  failureReason: transfer.failureReason,
  rateTimestamp: transfer.rateTimestamp?.toISOString() ?? null,
  createdAt: transfer.createdAt,
  updatedAt: transfer.updatedAt,
  completedAt: transfer.completedAt,
  beneficiary: toPublicBeneficiary(transfer.beneficiary),
  depositAddress: transfer.wallet ? toDepositAddress(transfer.wallet) : null,
});

export const quoteTransfer = async (
  userId: string,
  input: TransferQuoteInput,
): Promise<TransferQuote> => buildQuote(userId, input);

export const createTransfer = async (
  userId: string,
  input: CreateTransferInput,
) => {
  const quote = await buildQuote(userId, input);
  const limit = await getUserTransferLimit(userId);

  if (limit.kycStatus !== KycStatus.APPROVED) {
    throw AppError.forbidden("KYC approval is required before sending money");
  }

  if (
    !limit.unlimited &&
    limit.remainingUsd !== null &&
    quote.usdValue > limit.remainingUsd
  ) {
    throw AppError.badRequest(
      `Transfer exceeds your monthly limit. Remaining: $${limit.remainingUsd} USD`,
      { limit },
    );
  }

  const reference = await generateReference();

  const transfer = await prisma.transfer.create({
    data: {
      reference,
      senderId: userId,
      beneficiaryId: quote.beneficiaryId,
      asset: quote.asset,
      sendAmount: quote.amount,
      feeCrypto: quote.feeCrypto,
      usdValue: quote.usdValue,
      usdToEtb: quote.usdToEtb,
      grossEtb: quote.grossEtb,
      feeEtb: quote.feeEtb,
      payoutEtb: quote.payoutEtb,
      status: TransferStatus.INITIATED,
      rateTimestamp: new Date(quote.rateTimestamp),
    },
    include: transferInclude,
  });

  await getOrCreateDepositAddress(userId, transfer.id, quote.asset);

  const updated = await prisma.transfer.update({
    where: { id: transfer.id },
    data: { status: TransferStatus.AWAITING_CRYPTO },
    include: transferInclude,
  });

  return toPublicTransfer(updated);
};

export const listMyTransfers = async (userId: string) => {
  const transfers = await prisma.transfer.findMany({
    where: { senderId: userId },
    orderBy: { createdAt: "desc" },
    include: transferInclude,
  });

  return transfers.map(toPublicTransfer);
};

export const getTransferById = async (userId: string, transferId: string) => {
  const transfer = await prisma.transfer.findFirst({
    where: { id: transferId, senderId: userId },
    include: transferInclude,
  });

  if (!transfer) {
    throw AppError.notFound("Transfer not found");
  }

  return toPublicTransfer(transfer);
};

// --- New Endpoint Functions ---
export const confirmWallet = async (userId: string, transferId: string) => {
  const transfer = await prisma.transfer.findFirst({
    where: { id: transferId, senderId: userId },
    include: { wallet: true },
  });

  if (!transfer) {
    throw AppError.notFound("Transfer not found");
  }

  if (!transfer.wallet) {
    throw AppError.badRequest(
      "No deposit wallet associated with this transfer",
    );
  }

  const connectedWallets = await getMyWallets(userId);

  return {
    transfer: toPublicTransfer(transfer as any),
    connectedWallets,
    primaryConnectedWallet: connectedWallets[0] ?? null,
    depositWallet: transfer.wallet
      ? {
          address: transfer.wallet.address,
          asset: transfer.wallet.asset,
        }
      : null,
  };
};

export interface TransferReceipt {
  reference: string;
  status: string;
  asset: string;
  sendAmount: string;
  usdValue: string;
  usdToEtb: string;
  grossEtb: string;
  feeEtb: string;
  payoutEtb: string;
  beneficiary: {
    fullName: string;
    payoutMethod: string;
    bank?: string;
    accountNumber?: string;
    phoneNumber?: string;
  };
  txHash?: string;
  payoutReference?: string;
  completedAt?: string;
  createdAt: string;
}

export const getReceipt = async (
  userId: string,
  transferId: string,
): Promise<TransferReceipt> => {
  const transfer = await prisma.transfer.findFirst({
    where: { id: transferId, senderId: userId },
    include: { beneficiary: true },
  });

  if (!transfer) {
    throw AppError.notFound("Transfer not found");
  }

  return {
    reference: transfer.reference,
    status: transfer.status,
    asset: transfer.asset,
    sendAmount: transfer.sendAmount.toString(),
    usdValue: transfer.usdValue.toString(),
    usdToEtb: transfer.usdToEtb.toString(),
    grossEtb: transfer.grossEtb.toString(),
    feeEtb: transfer.feeEtb.toString(),
    payoutEtb: transfer.payoutEtb.toString(),
    beneficiary: {
      fullName: transfer.beneficiary.fullName,
      payoutMethod: transfer.beneficiary.payoutMethod,
      bank: transfer.beneficiary.bank ?? undefined,
      accountNumber: transfer.beneficiary.accountNumber ?? undefined,
      phoneNumber: transfer.beneficiary.phoneNumber ?? undefined,
    },
    txHash: transfer.txHash ?? undefined,
    payoutReference: transfer.payoutReference ?? undefined,
    completedAt: transfer.completedAt?.toISOString() ?? undefined,
    createdAt: transfer.createdAt.toISOString(),
  };
};

export interface PayoutDetails {
  status: string;
  payoutMethod: string;
  bank?: string;
  accountNumber?: string;
  phoneNumber?: string;
  amount: string;
  reference?: string;
  payoutReference?: string;
  processedAt?: string;
}

export const getPayout = async (
  userId: string,
  transferId: string,
): Promise<PayoutDetails> => {
  const transfer = await prisma.transfer.findFirst({
    where: { id: transferId, senderId: userId },
    include: { beneficiary: true },
  });

  if (!transfer) {
    throw AppError.notFound("Transfer not found");
  }

  return {
    status: transfer.status,
    payoutMethod: transfer.beneficiary.payoutMethod,
    bank: transfer.beneficiary.bank ?? undefined,
    accountNumber: transfer.beneficiary.accountNumber ?? undefined,
    phoneNumber: transfer.beneficiary.phoneNumber ?? undefined,
    amount: transfer.payoutEtb.toString(),
    reference: transfer.reference,
    payoutReference: transfer.payoutReference ?? undefined,
    processedAt: transfer.completedAt?.toISOString() ?? undefined,
  };
};
