"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { FileInput } from "@/components/ui/FileInput";
import { Input } from "@/components/ui/Input";
import { EmptyBlock, ErrorBlock, LoadingBlock, PageHeader } from "@/components/ui/PageStates";
import { ApiError } from "@/lib/api/client";
import { kycApi } from "@/lib/api/kyc";
import type { KycStatus, KycStatusResponse, KycTier, TierInfo } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/AuthContext";
import { cn, formatUsd, humanize, uploadUrl } from "@/lib/utils";

function statusTone(status: KycStatus): "success" | "warning" | "danger" | "neutral" {
  if (status === "APPROVED") return "success";
  if (status === "REJECTED") return "danger";
  if (status === "PENDING") return "warning";
  return "neutral";
}

function tierLabel(tier: KycTier): string {
  return humanize(tier.replace("TIER_", "Tier "));
}

function TierCard({
  info,
  selected,
  current,
  onSelect,
}: {
  info: TierInfo;
  selected: boolean;
  current: boolean;
  onSelect: () => void;
}) {
  const limit =
    info.monthlyLimitUsd === null
      ? "Unlimited"
      : `Up to ${formatUsd(info.monthlyLimitUsd)}/month`;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full flex-col rounded-xl border p-4 text-left transition-all",
        selected
          ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/20 dark:bg-indigo-500/10"
          : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-slate-900 dark:text-white">{tierLabel(info.tier)}</span>
        {current && <Badge tone="info">Current</Badge>}
      </div>
      <p className="mt-1 text-sm text-indigo-600 dark:text-indigo-400">{limit}</p>
      <ul className="mt-3 space-y-1">
        {info.requirements.map((req) => (
          <li key={req} className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="h-1 w-1 rounded-full bg-slate-400" />
            {req}
          </li>
        ))}
      </ul>
    </button>
  );
}

export default function KycPage() {
  const { refresh } = useAuth();
  const [data, setData] = useState<KycStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedTier, setSelectedTier] = useState<KycTier>("TIER_2");
  const [passport, setPassport] = useState<File | null>(null);
  const [nationalId, setNationalId] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [proofOfAddressUrl, setProofOfAddressUrl] = useState("");
  const [sourceOfFunds, setSourceOfFunds] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const status = await kycApi.getStatus();
      setData(status);
      setSelectedTier(status.verification?.tier ?? status.tier ?? "TIER_2");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load verification status.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSubmit = async () => {
    setSubmitError(null);
    setSubmitSuccess(false);

    if (selectedTier !== "TIER_1") {
      if (!passport && !nationalId && !data?.verification?.passportUrl && !data?.verification?.nationalIdUrl) {
        setSubmitError("Please upload a passport or national ID.");
        return;
      }
      if (!selfie && !data?.verification?.selfieUrl) {
        setSubmitError("Please upload a selfie.");
        return;
      }
    }

    if (selectedTier === "TIER_3") {
      if (!proofOfAddressUrl.trim()) {
        setSubmitError("Proof of address URL is required for Tier 3.");
        return;
      }
      if (!sourceOfFunds.trim()) {
        setSubmitError("Source of funds description is required for Tier 3.");
        return;
      }
    }

    setSubmitting(true);
    try {
      await kycApi.submit({
        tier: selectedTier,
        passport: passport ?? undefined,
        nationalId: nationalId ?? undefined,
        selfie: selfie ?? undefined,
        proofOfAddressUrl: proofOfAddressUrl.trim() || undefined,
        sourceOfFunds: sourceOfFunds.trim() || undefined,
      });
      setSubmitSuccess(true);
      setPassport(null);
      setNationalId(null);
      setSelfie(null);
      await load();
      await refresh();
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Verification" description="Complete KYC to unlock higher transfer limits." />
        <LoadingBlock label="Loading verification status…" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <PageHeader title="Verification" />
        <ErrorBlock message={error ?? "Something went wrong."} onRetry={load} />
      </div>
    );
  }

  const verification = data.verification;
  const hasPendingReview = data.status === "PENDING" && verification !== null;
  const canSubmit = data.status !== "APPROVED" && !hasPendingReview;
  const limitPct =
    data.limit.limitUsd && data.limit.limitUsd > 0
      ? Math.min(100, (data.limit.usedUsd / data.limit.limitUsd) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Verification"
        description="Complete identity verification to send money. Higher tiers unlock larger monthly limits."
      />

      {/* Status + limit overview */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Verification status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={statusTone(data.status)}>{humanize(data.status)}</Badge>
              <Badge tone="neutral">{tierLabel(data.tier)}</Badge>
            </div>
            {verification?.rejectionReason && (
              <Alert tone="error">
                <strong>Rejected:</strong> {verification.rejectionReason}
              </Alert>
            )}
            {hasPendingReview && (
              <Alert tone="info">
                Your documents are under review. We&apos;ll notify you once approved.
              </Alert>
            )}
            {data.status === "APPROVED" && (
              <Alert tone="success">
                Your identity is verified. You can send transfers up to your tier limit.
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly transfer limit</CardTitle>
          </CardHeader>
          <CardContent>
            {data.limit.unlimited ? (
              <p className="text-2xl font-semibold text-indigo-600 dark:text-indigo-400">
                Unlimited
              </p>
            ) : (
              <>
                <div className="flex items-baseline justify-between">
                  <p className="text-2xl font-semibold text-slate-900 dark:text-white">
                    {formatUsd(data.limit.remainingUsd ?? 0)}
                  </p>
                  <p className="text-sm text-slate-400">
                    of {formatUsd(data.limit.limitUsd)} remaining
                  </p>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all"
                    style={{ width: `${limitPct}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  {formatUsd(data.limit.usedUsd)} used this month
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tier selection */}
      {canSubmit && (
        <>
          <div>
            <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
              Choose verification tier
            </h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {data.tiers.map((tier) => (
                <TierCard
                  key={tier.tier}
                  info={tier}
                  selected={selectedTier === tier.tier}
                  current={data.tier === tier.tier && data.status === "APPROVED"}
                  onSelect={() => setSelectedTier(tier.tier)}
                />
              ))}
            </div>
          </div>

          {/* Document upload — Tier 2+ */}
          {selectedTier !== "TIER_1" && (
            <Card>
              <CardHeader>
                <CardTitle>Identity documents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {submitError && <Alert tone="error">{submitError}</Alert>}
                {submitSuccess && (
                  <Alert tone="success">
                    Documents submitted successfully. Your verification is now pending review.
                  </Alert>
                )}

                <FileInput
                  label="Passport"
                  hint="Upload your passport photo page"
                  value={passport}
                  onChange={setPassport}
                  existingUrl={uploadUrl(verification?.passportUrl)}
                />
                <FileInput
                  label="National ID"
                  hint="Or upload a national ID card"
                  value={nationalId}
                  onChange={setNationalId}
                  existingUrl={uploadUrl(verification?.nationalIdUrl)}
                />
                <FileInput
                  label="Selfie"
                  hint="A clear photo of your face holding your ID"
                  value={selfie}
                  onChange={setSelfie}
                  existingUrl={uploadUrl(verification?.selfieUrl)}
                />

                {selectedTier === "TIER_3" && (
                  <>
                    <Input
                      label="Proof of address URL"
                      placeholder="https://…"
                      hint="Link to a utility bill or bank statement"
                      value={proofOfAddressUrl}
                      onChange={(e) => setProofOfAddressUrl(e.target.value)}
                    />
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="sourceOfFunds"
                        className="text-sm font-medium text-slate-700 dark:text-slate-300"
                      >
                        Source of funds
                      </label>
                      <textarea
                        id="sourceOfFunds"
                        rows={3}
                        placeholder="Describe the origin of funds you plan to transfer…"
                        value={sourceOfFunds}
                        onChange={(e) => setSourceOfFunds(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </>
                )}

                <Button onClick={handleSubmit} loading={submitting} size="lg">
                  Submit for review
                </Button>
              </CardContent>
            </Card>
          )}

          {selectedTier === "TIER_1" && (
            <Card>
              <CardContent className="py-8">
                <EmptyBlock
                  title="Tier 1 — Basic verification"
                  description="Your email and phone from registration satisfy Tier 1 requirements. Submit to activate your $500/month limit."
                  action={
                    <Button onClick={handleSubmit} loading={submitting}>
                      Activate Tier 1
                    </Button>
                  }
                />
                {submitError && (
                  <div className="mt-4">
                    <Alert tone="error">{submitError}</Alert>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {hasPendingReview && verification && (
        <Card>
          <CardHeader>
            <CardTitle>Submitted documents</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {verification.passportUrl && (
                <li>
                  <a
                    href={uploadUrl(verification.passportUrl)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    Passport
                  </a>
                </li>
              )}
              {verification.nationalIdUrl && (
                <li>
                  <a
                    href={uploadUrl(verification.nationalIdUrl)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    National ID
                  </a>
                </li>
              )}
              {verification.selfieUrl && (
                <li>
                  <a
                    href={uploadUrl(verification.selfieUrl)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    Selfie
                  </a>
                </li>
              )}
              {!verification.passportUrl &&
                !verification.nationalIdUrl &&
                !verification.selfieUrl && (
                  <li className="text-slate-400">Tier 1 submission — no documents required.</li>
                )}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
