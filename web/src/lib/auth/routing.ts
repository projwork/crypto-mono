import type { PublicUser } from "@/lib/api/types";
import { kycApi } from "@/lib/api/kyc";

/** Resolve the correct KYC route from user + optional verification record. */
export function resolveKycRoute(
  user: PublicUser,
  verification?: { status: string } | null,
): string {
  if (user.role === "ADMIN" || user.kycStatus === "APPROVED") {
    return "/dashboard";
  }
  if (user.kycStatus === "REJECTED") {
    return "/kyc/submit";
  }
  if (verification?.status === "PENDING") {
    return "/kyc/status";
  }
  return "/kyc/submit";
}

export function needsKycGate(user: PublicUser): boolean {
  return user.role !== "ADMIN" && user.kycStatus !== "APPROVED";
}

/** Fetch KYC status and return the post-auth destination. */
export async function getPostAuthRoute(user: PublicUser): Promise<string> {
  if (user.role === "ADMIN" || user.kycStatus === "APPROVED") {
    return "/dashboard";
  }
  try {
    const status = await kycApi.getStatus();
    return resolveKycRoute(user, status.verification);
  } catch {
    return resolveKycRoute(user);
  }
}
