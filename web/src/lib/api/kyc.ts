import { api } from "./client";
import type {
  KycStatusResponse,
  KycTier,
  PublicKycVerification,
  SubmitKycPayload,
} from "./types";

export interface PendingKycUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  country: string;
}

export interface PendingKycItem extends PublicKycVerification {
  user: PendingKycUser;
}

export const kycApi = {
  async getStatus(): Promise<KycStatusResponse> {
    return api.get<KycStatusResponse>("/api/kyc/status");
  },

  async chooseTier(tier: KycTier): Promise<PublicKycVerification> {
    const { verification } = await api.post<{ verification: PublicKycVerification }>(
      "/api/kyc/tier",
      { tier },
    );
    return verification;
  },

  async submit(payload: SubmitKycPayload): Promise<PublicKycVerification> {
    const form = new FormData();
    if (payload.tier) form.append("tier", payload.tier);
    if (payload.proofOfAddressUrl) form.append("proofOfAddressUrl", payload.proofOfAddressUrl);
    if (payload.sourceOfFunds) form.append("sourceOfFunds", payload.sourceOfFunds);
    if (payload.passportUrl) form.append("passportUrl", payload.passportUrl);
    if (payload.nationalIdUrl) form.append("nationalIdUrl", payload.nationalIdUrl);
    if (payload.selfieUrl) form.append("selfieUrl", payload.selfieUrl);
    if (payload.passport) form.append("passport", payload.passport);
    if (payload.nationalId) form.append("nationalId", payload.nationalId);
    if (payload.selfie) form.append("selfie", payload.selfie);

    const { verification } = await api.upload<{ verification: PublicKycVerification }>(
      "/api/kyc/submit",
      form,
    );
    return verification;
  },

  async listPending(): Promise<PendingKycItem[]> {
    const { pending } = await api.get<{ pending: PendingKycItem[] }>("/api/kyc/pending");
    return pending;
  },

  async approve(verificationId: string): Promise<PublicKycVerification> {
    const { verification } = await api.post<{ verification: PublicKycVerification }>(
      `/api/kyc/${verificationId}/approve`,
    );
    return verification;
  },

  async reject(verificationId: string, reason: string): Promise<PublicKycVerification> {
    const { verification } = await api.post<{ verification: PublicKycVerification }>(
      `/api/kyc/${verificationId}/reject`,
      { reason },
    );
    return verification;
  },
};
