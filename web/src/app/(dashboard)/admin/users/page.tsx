"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useRef } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ErrorBlock, LoadingBlock, PageHeader } from "@/components/ui/PageStates";
import { ApiError } from "@/lib/api/client";
import { adminApi } from "@/lib/api/admin";
import type { KycTier, KycStatus } from "@/lib/api/types";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [roleFilter, setRoleFilter] = useState("");
  const [search, setSearch] = useState("");

  const latestRequestRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++latestRequestRef.current;
    setLoading(true);
    setError(null);
    try {
      const list = await adminApi.listUsers({ role: roleFilter || undefined, search: search.trim() || undefined, limit: 200 });
      if (requestId !== latestRequestRef.current) return;
      setUsers(list);
    } catch (err) {
      if (requestId !== latestRequestRef.current) return;
      setError(err instanceof ApiError ? err.message : "Failed to load users.");
    } finally {
      if (requestId === latestRequestRef.current) setLoading(false);
    }
  }, [roleFilter, search]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <PageHeader title="Users" description="List of registered users and activity counts." />

      <div className="grid gap-4 sm:grid-cols-3">
        <Select
          label="Role"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          options={[
            { value: "", label: "All roles" },
            { value: "SENDER", label: "Sender" },
            { value: "ADMIN", label: "Admin" },
          ]}
        />
        <Input label="Search" placeholder="Name, email or phone" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading && <LoadingBlock label="Loading users…" />}
      {!loading && error && <ErrorBlock message={error} onRetry={load} />}

      {!loading && !error && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-900/80">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Phone</th>
                  <th className="px-5 py-3 font-medium">Country</th>
                  <th className="px-5 py-3 font-medium">KYC</th>
                  <th className="px-5 py-3 font-medium">Counts</th>
                  <th className="px-5 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30">
                    <td className="px-5 py-4">
                      <Link href={`/admin/users/${u.id}`} className="font-medium text-slate-900 dark:text-white">
                        {u.firstName} {u.lastName}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-400">{u.email}</td>
                    <td className="px-5 py-4">{u.phone}</td>
                    <td className="px-5 py-4">{u.country}</td>
                    <td className="px-5 py-4">
                      <div className="text-sm">
                        <div className="font-medium">{u.kycTier}</div>
                        <div className="text-xs text-slate-400">{u.kycStatus}</div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500">
                      <div>Beneficiaries: {u.beneficiariesCount}</div>
                      <div>Transfers: {u.transfersCount}</div>
                      <div>Wallets: {u.connectedWalletsCount}</div>
                      <div>Submissions: {u.kycSubmissionsCount}</div>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                      No users match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
