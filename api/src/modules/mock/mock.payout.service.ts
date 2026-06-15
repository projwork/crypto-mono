import crypto from "node:crypto";
import { AppError } from "../../lib/apiResponse.js";
import type { PayoutInput } from "./mock.schemas.js";

export type PayoutBank = "cbe" | "awash" | "dashen" | "telebirr";

const genRef = (prefix: string): string =>
  `${prefix}-${crypto.randomInt(10000, 99999)}`;

/** PRD §13.3–13.6 bank payout success shape. */
export interface BankPayoutResponse {
  success: true;
  reference: string;
  status: "COMPLETED";
}

/** PRD §13.3 Telebirr success shape. */
export interface TelebirrPayoutResponse {
  success: true;
  transactionId: string;
  status: "COMPLETED";
}

export interface PayoutFailureResponse {
  success: false;
  status: "FAILED";
  message: string;
}

export type PayoutResponse =
  | BankPayoutResponse
  | TelebirrPayoutResponse
  | PayoutFailureResponse;

const REF_PREFIX: Record<PayoutBank, string> = {
  cbe: "CBE",
  awash: "AWS",
  dashen: "DSH",
  telebirr: "TLB",
};

/** ~15% random failure when failMode is enabled (demo failure path). */
const shouldSimulateFailure = (failMode: boolean): boolean =>
  failMode && crypto.randomInt(1, 101) <= 15;

export const processPayout = (
  bank: PayoutBank,
  input: PayoutInput,
  failMode: boolean,
): PayoutResponse => {
  if (bank === "telebirr") {
    if (!input.phone?.trim()) {
      throw AppError.badRequest("phone is required for Telebirr payout");
    }
  } else if (!input.accountNumber?.trim()) {
    throw AppError.badRequest("accountNumber is required for bank payout");
  }

  if (shouldSimulateFailure(failMode)) {
    return {
      success: false,
      status: "FAILED",
      message: `Mock ${bank.toUpperCase()} payout failed — try again or disable ?fail=true`,
    };
  }

  if (bank === "telebirr") {
    return {
      success: true,
      transactionId: genRef(REF_PREFIX.telebirr),
      status: "COMPLETED",
    };
  }

  return {
    success: true,
    reference: genRef(REF_PREFIX[bank]),
    status: "COMPLETED",
  };
};
