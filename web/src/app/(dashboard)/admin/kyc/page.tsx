"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Drawer } from "@/components/ui/Drawer";
import { Modal } from "@/components/ui/Modal";
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

interface DocumentViewerProps {
  label: string;
  url?: string;
}

function DocumentViewer({ label, url }: DocumentViewerProps) {
  const [imageError, setImageError] = useState(false);

  if (!url || url === "string") return null;

  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url) || url.startsWith("/uploads/");

  return (
    <div className="space-y-2 border-b border-slate-100 pb-4 last:border-0 last:pb-0 dark:border-slate-800">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</p>
        <a
          href={uploadUrl(url) || url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
        >
          Open in new tab
        </a>
      </div>
      {isImage && !imageError ? (
        <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
          <img
            src={uploadUrl(url) || url}
            alt={label}
            onError={() => setImageError(true)}
            className="max-h-64 w-full object-contain bg-slate-50 dark:bg-slate-800"
          />
        </div>
      ) : (
        <p className="text-xs text-slate-400 dark:text-slate-500 italic">
          File: {url}
        </p>
      )}
    </div>
  );
}

interface RejectModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  loading: boolean;
}

function RejectModal({ open, onClose, onConfirm, loading }: RejectModalProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setReason("");
      setError(null);
    }
  }, [open]);

  const handleConfirm = async () => {
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      setError("Rejection reason is required");
      return;
    }
    try {
      setError(null);
      await onConfirm(trimmedReason);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Rejection failed");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Reject KYC Submission">
      <div className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Please provide a reason for rejecting this KYC submission. The user will be notified.
        </p>

        {error && <Alert tone="error">{error}</Alert>}

        <Input
          label="Rejection Reason"
          placeholder="Enter reason for rejection…"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={loading}
          maxLength={500}
        />

        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button className="flex-1" loading={loading} onClick={handleConfirm}>
            Confirm Rejection
          </Button>
        </div>
      </div>
    </Modal>
  );
}

interface KycReviewDrawerProps {
  item: PendingKycItem | null;
  open: boolean;
  onClose: () => void;
  onResolved: () => void;
}

function KycReviewDrawer({ item, open, onClose, onResolved }: KycReviewDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      setError(null);
      setRejectModalOpen(false);
    }
  }, [open]);

  if (!item) return null;

  const handleApprove = async () => {
    setLoading(true);
    setError(null);
    try {
      await kycApi.approve(item.id);
      onResolved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Approval failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRejectConfirm = async (reason: string) => {
    setLoading(true);
    setError(null);
    try {
      await kycApi.reject(item.id, reason);
      setRejectModalOpen(false);
      onResolved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Rejection failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

const documents = [
  { label: "Passport", url: item.passportUrl || undefined },
  { label: "National ID", url: item.nationalIdUrl || undefined },
  { label: "Selfie", url: item.selfieUrl || undefined },
  { label: "Proof of Address", url: item.proofOfAddressUrl || undefined },
].filter((d) => d.url && d.url !== "string");

  return (
    <>
      <Drawer open={open} onClose={onClose} title="KYC Review">
        <div className="space-y-6">
          {/* User Information Section */}
          <div className="space-y-2">
            <div className="border-b border-slate-200 pb-4 dark:border-slate-700">
              <p className="text-xl font-semibold text-slate-900 dark:text-white">
                {item.user.firstName} {item.user.lastName}
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {item.user.email}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{item.user.country}</p>
            </div>
          </div>

          {/* Metadata Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Target Tier
              </span>
              <Badge tone="warning">{tierLabel(item.tier)}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Submission Date
              </span>
              <span className="text-sm text-slate-700 dark:text-slate-300">
                {formatDateTime(item.createdAt)}
              </span>
            </div>
            {item.id && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Verification ID
                </span>
                <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
                  {item.id.slice(0, 8)}…
                </span>
              </div>
            )}
          </div>

          {/* Source of Funds Section */}
          {item.sourceOfFunds && item.sourceOfFunds !== "string" && (
            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Source of Funds
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {item.sourceOfFunds}
              </p>
            </div>
          )}

          {/* Documents Section */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              Uploaded Documents ({documents.length})
            </p>
            <div className="space-y-4 rounded-xl border border-slate-100 p-4 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              {documents.length > 0 ? (
                documents.map((doc) => (
                  <DocumentViewer key={doc.label} label={doc.label} url={doc.url} />
                ))
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-2">
                  No active files uploaded for this profile tier level.
                </p>
              )}
            </div>
          </div>

          {/* Error Alert */}
          {error && <Alert tone="error">{error}</Alert>}

          {/* Action Buttons */}
          <div className="border-t border-slate-200 pt-4 dark:border-slate-700">
            <div className="flex gap-3">
              <Button
                className="flex-1"
                loading={loading}
                onClick={handleApprove}
                disabled={rejectModalOpen}
              >
                Verify & Approve
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                loading={loading}
                onClick={() => setRejectModalOpen(true)}
                disabled={rejectModalOpen}
              >
                Reject Submission
              </Button>
            </div>
          </div>
        </div>
      </Drawer>

      <RejectModal
        open={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        onConfirm={handleRejectConfirm}
        loading={loading}
      />
    </>
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
      const items = await kycApi.listPending();
      setPending(items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load pending KYC submissions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSelectItem = (item: PendingKycItem) => {
    setSelected(item);
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="KYC Review"
        description="Review and approve or reject pending identity verifications."
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
        <div className="space-y-3">
          <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
            {pending.length} pending verification{pending.length !== 1 ? "s" : ""}
          </div>
          {pending.map((item) => (
            <Card
              key={item.id}
              className="cursor-pointer transition-all hover:shadow-md active:shadow-sm dark:hover:border-slate-700"
              onClick={() => handleSelectItem(item)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-base">
                    {item.user.firstName} {item.user.lastName}
                  </CardTitle>
                  <Badge tone="warning">{tierLabel(item.tier)}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {item.user.email}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-500">
                    {item.user.country}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-2 text-xs text-slate-500 dark:text-slate-500">
                  <span>Submitted {formatDateTime(item.createdAt)}</span>
                  <span className="text-indigo-600 dark:text-indigo-400">Click to review →</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <KycReviewDrawer
        item={selected}
        open={drawerOpen}
        onClose={handleDrawerClose}
        onResolved={load}
      />
    </div>
  );
}