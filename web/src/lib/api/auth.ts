import { api } from "./client";
import { tokenStore } from "./tokenStore";
import type { AuthResult, LoginPayload, PublicUser, RegisterPayload } from "./types";

export const authApi = {
  async register(payload: RegisterPayload): Promise<AuthResult> {
    const result = await api.post<AuthResult>("/api/auth/register", payload, false);
    tokenStore.set(result.tokens);
    return result;
  },

  async login(payload: LoginPayload): Promise<AuthResult> {
    const result = await api.post<AuthResult>("/api/auth/login", payload, false);
    tokenStore.set(result.tokens);
    return result;
  },

  async me(): Promise<PublicUser> {
    const { user } = await api.get<{ user: PublicUser }>("/api/auth/me");
    return user;
  },

  async logout(): Promise<void> {
    const refreshToken = tokenStore.getRefresh();
    try {
      if (refreshToken) {
        await api.post("/api/auth/logout", { refreshToken }, false);
      }
    } finally {
      tokenStore.clear();
    }
  },
};
