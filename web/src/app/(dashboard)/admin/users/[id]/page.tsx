"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ErrorBlock, LoadingBlock, PageHeader } from "@/components/ui/PageStates";
import { ApiError } from "@/lib/api/client";
import { adminApi } from "@/lib/api/admin";
import { uploadUrl } from "@/lib/utils";

export default function AdminUserDetailPage() {
  const params = useParams();
  const rawId = (params as Record<string, unknown>)?.id;
  const id = typeof rawId === "string" ? rawId : null;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [wallets, setWallets] = useState<any[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);

  const load = useCallback(async () => {
    if (!id) {
      setError("Invalid user id.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getUser(id);
      setUser(res.user);
      setWallets(res.wallets || []);
      setBeneficiaries(res.beneficiaries || []);
      setTransfers(res.transfers || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load user details.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <LoadingBlock label="Loading user…" />;
  if (error || !user) return <ErrorBlock message={error ?? "User not found."} onRetry={load} />;

  return (
    <div className="space-y-6">
      <PageHeader title={`${user.firstName} ${user.lastName}`} description={user.email} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>
                <strong>Phone:</strong> {user.phone}
              </div>
              <div>
                <strong>Country:</strong> {user.country}
              </div>
              <div>
                <strong>Role:</strong> {user.role}
              </div>
              <div>
                <strong>KYC:</strong> {user.kycTier} · {user.kycStatus}
              </div>
              <div>
                <strong>Created:</strong> {user.createdAt}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Connected wallets</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {wallets.map((w) => (
                <li key={w.id}>
                  <div className="font-medium">{w.address}</div>
                  <div className="text-xs text-slate-400">{w.chain} · {w.active ? "active" : "inactive"}</div>
                </li>
              ))}
              {wallets.length === 0 && <li className="text-slate-400">No wallets connected.</li>}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Beneficiaries</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {beneficiaries.map((b) => (
              <li key={b.id}>
                <div className="font-medium">{b.fullName}</div>
                <div className="text-xs text-slate-400">{b.country} · {b.payoutMethod}</div>
              </li>
            ))}
            {beneficiaries.length === 0 && <li className="text-slate-400">No beneficiaries.</li>}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transfers</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm">
            {transfers.map((t) => (
              <li key={t.id} className="space-y-1">
                <div className="font-medium">{t.reference} · {t.status}</div>
                <div className="text-xs text-slate-400">{t.asset} · {t.sendAmount}</div>
              </li>
            ))}
            {transfers.length === 0 && <li className="text-slate-400">No transfers.</li>}
          </ul>
        </CardContent>
      </Card>

      <div>
        <Link href="/admin/users" className="text-sm text-indigo-600 hover:underline">Back to users</Link>
      </div>
    </div>
  );
}
