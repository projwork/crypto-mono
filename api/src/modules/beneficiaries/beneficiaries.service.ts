import { PayoutMethod, type Beneficiary } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../lib/apiResponse.js";
import {
  type CreateBeneficiaryInput,
  type UpdateBeneficiaryInput,
  validatePayoutFields,
} from "./beneficiaries.schemas.js";

/** Public beneficiary shape — documented in CONTRACTS.md. */
export const toPublicBeneficiary = (beneficiary: Beneficiary) => ({
  id: beneficiary.id,
  fullName: beneficiary.fullName,
  country: beneficiary.country,
  payoutMethod: beneficiary.payoutMethod,
  bank: beneficiary.bank,
  accountNumber: beneficiary.accountNumber,
  phoneNumber: beneficiary.phoneNumber,
  isFavorite: beneficiary.isFavorite,
  createdAt: beneficiary.createdAt,
  updatedAt: beneficiary.updatedAt,
});

export type PublicBeneficiary = ReturnType<typeof toPublicBeneficiary>;

const getOwnedBeneficiary = async (userId: string, id: string): Promise<Beneficiary> => {
  const beneficiary = await prisma.beneficiary.findFirst({
    where: { id, userId },
  });

  if (!beneficiary) {
    throw AppError.notFound("Beneficiary not found");
  }

  return beneficiary;
};

const normalizePayoutData = (input: {
  payoutMethod: PayoutMethod;
  bank?: CreateBeneficiaryInput["bank"];
  accountNumber?: CreateBeneficiaryInput["accountNumber"];
  phoneNumber?: CreateBeneficiaryInput["phoneNumber"];
}) => {
  if (input.payoutMethod === PayoutMethod.BANK) {
    return {
      bank: input.bank ?? null,
      accountNumber: input.accountNumber?.trim() ?? null,
      phoneNumber: null,
    };
  }

  return {
    bank: null,
    accountNumber: null,
    phoneNumber: input.phoneNumber?.trim() ?? null,
  };
};

export const createBeneficiary = async (userId: string, input: CreateBeneficiaryInput) => {
  const payout = normalizePayoutData(input);

  const beneficiary = await prisma.beneficiary.create({
    data: {
      userId,
      fullName: input.fullName.trim(),
      country: input.country.trim(),
      payoutMethod: input.payoutMethod,
      ...payout,
    },
  });

  return toPublicBeneficiary(beneficiary);
};

export const listBeneficiaries = async (userId: string) => {
  const beneficiaries = await prisma.beneficiary.findMany({
    where: { userId },
    orderBy: [{ isFavorite: "desc" }, { fullName: "asc" }],
  });

  return beneficiaries.map(toPublicBeneficiary);
};

export const getBeneficiary = async (userId: string, id: string) => {
  const beneficiary = await getOwnedBeneficiary(userId, id);
  return toPublicBeneficiary(beneficiary);
};

export const updateBeneficiary = async (
  userId: string,
  id: string,
  input: UpdateBeneficiaryInput,
) => {
  const existing = await getOwnedBeneficiary(userId, id);

  const merged = {
    fullName: input.fullName?.trim() ?? existing.fullName,
    country: input.country?.trim() ?? existing.country,
    payoutMethod: input.payoutMethod ?? existing.payoutMethod,
    bank: input.bank !== undefined ? input.bank : existing.bank,
    accountNumber:
      input.accountNumber !== undefined ? input.accountNumber : existing.accountNumber,
    phoneNumber: input.phoneNumber !== undefined ? input.phoneNumber : existing.phoneNumber,
  };

  validatePayoutFields(merged);

  const payout = normalizePayoutData({
    payoutMethod: merged.payoutMethod,
    bank: merged.bank,
    accountNumber: merged.accountNumber,
    phoneNumber: merged.phoneNumber,
  });

  const beneficiary = await prisma.beneficiary.update({
    where: { id },
    data: {
      fullName: merged.fullName,
      country: merged.country,
      payoutMethod: merged.payoutMethod,
      ...payout,
    },
  });

  return toPublicBeneficiary(beneficiary);
};

export const deleteBeneficiary = async (userId: string, id: string): Promise<void> => {
  await getOwnedBeneficiary(userId, id);

  try {
    await prisma.beneficiary.delete({ where: { id } });
  } catch {
    throw AppError.conflict(
      "Cannot delete beneficiary because they are linked to existing transfers",
    );
  }
};

export const toggleFavoriteBeneficiary = async (userId: string, id: string) => {
  const existing = await getOwnedBeneficiary(userId, id);

  const beneficiary = await prisma.beneficiary.update({
    where: { id },
    data: { isFavorite: !existing.isFavorite },
  });

  return toPublicBeneficiary(beneficiary);
};
