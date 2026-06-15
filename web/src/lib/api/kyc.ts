import { api } from "./client";
import type {
  KycStatusResponse,
  KycTier,
  PublicKycVerification,
  SubmitKycPayload,
} from "./types";

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
    if (payload.passport) form.append("passport", payload.passport);
    if (payload.nationalId) form.append("nationalId", payload.nationalId);
    if (payload.selfie) form.append("selfie", payload.selfie);

    const { verification } = await api.upload<{ verification: PublicKycVerification }>(
      "/api/kyc/submit",
      form,
    );
    return verification;
  },
};
