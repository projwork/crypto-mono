"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader, LoadingBlock, EmptyBlock, ErrorBlock } from "@/components/ui/PageStates";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { notificationsApi } from "@/lib/api/notifications";
import { ApiError } from "@/lib/api/client";
import type { UserNotification } from "@/lib/api/types";
import { formatDateTime } from "@/lib/transfers/status";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await notificationsApi.list();
      setNotifications(list);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const markRead = useCallback(async (id: string) => {
    try {
      const updated = await notificationsApi.markRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
    } catch {
      /* ignore for now */
    }
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Notifications" description="Your recent notifications." />

      {loading && <LoadingBlock label="Loading notifications…" />}
      {!loading && error && <ErrorBlock message={error} onRetry={load} />}

      {!loading && !error && notifications.length === 0 && (
        <Card>
          <CardContent>
            <EmptyBlock
              title="No notifications"
              description="You'll see notifications here when there are updates about your transfers."
            />
          </CardContent>
        </Card>
      )}

      {!loading && !error && notifications.length > 0 && (
        <div className="space-y-3">
          {notifications.map((n) => (
            <Card key={n.id}>
              <CardContent>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-slate-900 dark:text-white">{n.title}</h3>
                      <span className="text-xs text-slate-400">{n.type}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{n.message}</p>
                    <p className="mt-2 text-xs text-slate-400">{formatDateTime(n.createdAt)}</p>
                  </div>

                  <div className="shrink-0">
                    {!n.isRead ? (
                      <Button size="sm" onClick={() => void markRead(n.id)}>
                        Mark read
                      </Button>
                    ) : (
                      <span className="text-sm text-slate-400">Read</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
