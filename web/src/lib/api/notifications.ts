import { api } from "./client";
import type { UserNotification } from "./types";

export const notificationsApi = {
  async list(limit?: number): Promise<UserNotification[]> {
    const q = limit ? `?limit=${encodeURIComponent(String(limit))}` : "";
    const { notifications } = await api.get<{ notifications: UserNotification[] }>(
      `/api/notifications${q}`,
    );
    return notifications;
  },

  async markRead(id: string): Promise<UserNotification> {
    const { notification } = await api.post<{ notification: UserNotification }>(
      `/api/notifications/${encodeURIComponent(id)}/read`,
    );
    return notification;
  },
};

export default notificationsApi;
