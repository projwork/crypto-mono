import { api } from "./client";
import type {
  CreateBeneficiaryPayload,
  PublicBeneficiary,
  UpdateBeneficiaryPayload,
} from "./types";

export const beneficiariesApi = {
  async list(): Promise<PublicBeneficiary[]> {
    const { beneficiaries } = await api.get<{ beneficiaries: PublicBeneficiary[] }>(
      "/api/beneficiaries",
    );
    return beneficiaries;
  },

  async get(id: string): Promise<PublicBeneficiary> {
    const { beneficiary } = await api.get<{ beneficiary: PublicBeneficiary }>(
      `/api/beneficiaries/${id}`,
    );
    return beneficiary;
  },

  async create(payload: CreateBeneficiaryPayload): Promise<PublicBeneficiary> {
    const { beneficiary } = await api.post<{ beneficiary: PublicBeneficiary }>(
      "/api/beneficiaries",
      payload,
    );
    return beneficiary;
  },

  async update(id: string, payload: UpdateBeneficiaryPayload): Promise<PublicBeneficiary> {
    const { beneficiary } = await api.put<{ beneficiary: PublicBeneficiary }>(
      `/api/beneficiaries/${id}`,
      payload,
    );
    return beneficiary;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/api/beneficiaries/${id}`);
  },

  async toggleFavorite(id: string): Promise<PublicBeneficiary> {
    const { beneficiary } = await api.post<{ beneficiary: PublicBeneficiary }>(
      `/api/beneficiaries/${id}/favorite`,
    );
    return beneficiary;
  },
};
