"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Drawer } from "@/components/ui/Drawer";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { EmptyBlock, ErrorBlock, LoadingBlock, PageHeader } from "@/components/ui/PageStates";
import { ApiError } from "@/lib/api/client";
import { kycApi, type PendingKycItem } from "@/lib/api/kyc";
import { humanize, uploadUrl } from "@/lib/utils";
import { formatDateTime } from "@/lib/transfers/status";

function tierLabel(tier: string): string {
  return humanize(tier.replace("TIER_", "Tier "));
}

function KycReviewDrawer({
  item,
  open,
  onClose,
  onResolved,
}: {
  item: PendingKycItem | null;
  open: boolean;
  onClose: () => void;
  onResolved: () => void;
}) {
  const [rejectReason, setRejectReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRejectReason("");
    setError(null);
  }, [item?.id, open]);

  if (!item) return null;

  const handleApprove = async () => {
    setLoading(true);
    setError(null);
    try {
      await kycApi.approve(item.id);
      onResolved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Approval failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setError("A rejection reason is required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await kycApi.reject(item.id, rejectReason.trim());
      onResolved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Rejection failed.");
    } finally {
      setLoading(false);
    }
  };

  const docs = [
    { label: "Passport", url: item.passportUrl },
    { label: "National ID", url: item.nationalIdUrl },
    { label: "Selfie", url: item.selfieUrl },
  ].filter((d) => d.url);

  return (
    <Drawer open={open} onClose={onClose} title="Review KYC submission">
      <div className="space-y-5">
        <div>
          <p className="text-lg font-semibold text-slate-900 dark:text-white">
            {item.user.firstName} {item.user.lastName}
          </p>
          <p className="text-sm text-slate-500">{item.user.email}</p>
          <p className="text-sm text-slate-400">{item.user.country}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge tone="warning">{tierLabel(item.tier)}</Badge>
          <Badge tone="info">Pending review</Badge>
        </div>

        <p className="text-xs text-slate-400">Submitted {formatDateTime(item.createdAt)}</p>

        {item.sourceOfFunds && (
          <div className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800/50">
            <p className="font-medium text-slate-700 dark:text-slate-300">Source of funds</p>
            <p className="mt-1 text-slate-600 dark:text-slate-400">{item.sourceOfFunds}</p>
          </div>
        )}

        {item.proofOfAddressUrl && (
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Proof of address</p>
            <a
              href={item.proofOfAddressUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-indigo-600 hover:underline"
            >
              View document
            </a>
          </div>
        )}

        {docs.length > 0 ? (
          <ul className="space-y-2">
            {docs.map((doc) => (
              <li key={doc.label}>
                <a
                  href={uploadUrl(doc.url)!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  {doc.label}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-400">Tier 1 submission — no documents uploaded.</p>
        )}

        {error && <Alert tone="error">{error}</Alert>}

        <Input
          label="Rejection reason"
          placeholder="Required if rejecting…"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
        />

        <div className="flex gap-2">
          <Button className="flex-1" loading={loading} onClick={handleApprove}>
            Approve
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            loading={loading}
            onClick={handleReject}
          >
            Reject
          </Button>
        </div>
      </div>
    </Drawer>
  );
}

export default function AdminKycPage() {
  const [pending, setPending] = useState<PendingKycItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<PendingKycItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPending(await kycApi.listPending());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load pending KYC.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="KYC review"
        description="Approve or reject pending identity verifications (PRD §11 manual approval)."
      />

      {loading && <LoadingBlock label="Loading pending submissions…" />}
      {!loading && error && <ErrorBlock message={error} onRetry={load} />}

      {!loading && !error && pending.length === 0 && (
        <Card>
          <CardContent>
            <EmptyBlock
              title="Queue is empty"
              description="No pending KYC submissions to review."
            />
          </CardContent>
        </Card>
      )}

      {!loading && !error && pending.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {pending.map((item) => (
            <Card
              key={item.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => {
                setSelected(item);
                setDrawerOpen(true);
              }}
            >
              <CardHeader>
                <CardTitle className="text-base">
                  {item.user.firstName} {item.user.lastName}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-slate-500">{item.user.email}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge tone="info">{tierLabel(item.tier)}</Badge>
                  <Badge tone="warning">Pending</Badge>
                </div>
                <p className="text-xs text-slate-400">
                  Submitted {formatDateTime(item.createdAt)}
                </p>
                <Button size="sm" variant="secondary" className="mt-2">
                  Review submission
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <KycReviewDrawer
        item={selected}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onResolved={load}
      />
    </div>
  );
}
