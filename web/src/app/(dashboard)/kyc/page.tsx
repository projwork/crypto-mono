'use client';

import { useCallback, useEffect, useState } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { FileInput } from '@/components/ui/FileInput';
import { Input } from '@/components/ui/Input';
import {
  EmptyBlock,
  ErrorBlock,
  LoadingBlock,
  PageHeader,
} from '@/components/ui/PageStates';
import { ApiError } from '@/lib/api/client';
import { kycApi } from '@/lib/api/kyc';
import type {
  KycStatus,
  KycStatusResponse,
  KycTier,
  SubmitKycPayload,
  TierInfo,
} from '@/lib/api/types';
import { useAuth } from '@/lib/auth/AuthContext';
import { cn, formatUsd, humanize, uploadUrl } from '@/lib/utils';

function statusTone(
  status: KycStatus,
): 'success' | 'warning' | 'danger' | 'neutral' {
  if (status === 'APPROVED') return 'success';
  if (status === 'REJECTED') return 'danger';
  if (status === 'PENDING') return 'warning';
  return 'neutral';
}

function tierLabel(tier: KycTier): string {
  return humanize(tier.replace('TIER_', 'Tier '));
}

function initialSelectedTier(status: KycStatusResponse): KycTier {
  if (status.status === 'APPROVED' && status.tier !== 'TIER_3') {
    return status.tier === 'TIER_1' ? 'TIER_2' : 'TIER_3';
  }
  return (
    status.verification?.tier ?? status.latestApplication?.tier ?? 'TIER_2'
  );
}

const TIER_ORDER: Record<KycTier, number> = { TIER_1: 1, TIER_2: 2, TIER_3: 3 };

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
      ? 'Unlimited'
      : `Up to ${formatUsd(info.monthlyLimitUsd)}/month`;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full flex-col rounded-xl border p-4 text-left transition-all',
        selected
          ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/20 dark:bg-indigo-500/10'
          : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-slate-900 dark:text-white">
          {tierLabel(info.tier)}
        </span>
        {current && <Badge tone="info">Current</Badge>}
      </div>
      <p className="mt-1 text-sm text-indigo-600 dark:text-indigo-400">
        {limit}
      </p>
      <ul className="mt-3 space-y-1">
        {info.requirements.map((req) => (
          <li
            key={req}
            className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400"
          >
            <span className="h-1 w-1 rounded-full bg-slate-400" />
            {req}
          </li>
        ))}
      </ul>
    </button>
  );
}

function hasExistingIdentityDocs(
  verification: KycStatusResponse['verification'],
): boolean {
  if (!verification) return false;
  const hasId = Boolean(verification.passportUrl || verification.nationalIdUrl);
  return hasId && Boolean(verification.selfieUrl);
}

// Reusable document fields used in multiple form sections.
function DocumentFields({
  tier,
  passport,
  onPassport,
  nationalId,
  onNationalId,
  selfie,
  onSelfie,
  proofOfAddressUrl,
  onProofOfAddressUrl,
  sourceOfFunds,
  onSourceOfFunds,
  existingPassportUrl,
  existingNationalIdUrl,
  existingSelfieUrl,
  reuseExistingIdentity = false,
}: {
  tier: KycTier;
  passport: File | null;
  onPassport: (f: File | null) => void;
  nationalId: File | null;
  onNationalId: (f: File | null) => void;
  selfie: File | null;
  onSelfie: (f: File | null) => void;
  proofOfAddressUrl: string;
  onProofOfAddressUrl: (v: string) => void;
  sourceOfFunds: string;
  onSourceOfFunds: (v: string) => void;
  existingPassportUrl?: string | null;
  existingNationalIdUrl?: string | null;
  existingSelfieUrl?: string | null;
  /** When true, hide ID uploads — existing verified documents will be reused. */
  reuseExistingIdentity?: boolean;
}) {
  return (
    <>
      {reuseExistingIdentity ? (
        <Alert tone="info">
          Your verified identity documents on file will be reused for this tier
          upgrade. Provide the Tier 3 details below.
        </Alert>
      ) : (
        <>
          <FileInput
            label="Passport"
            hint="Upload your passport photo page"
            value={passport}
            onChange={onPassport}
            existingUrl={uploadUrl(existingPassportUrl) ?? undefined}
          />
          <FileInput
            label="National ID"
            hint="Or upload a national ID card"
            value={nationalId}
            onChange={onNationalId}
            existingUrl={uploadUrl(existingNationalIdUrl) ?? undefined}
          />
          <FileInput
            label="Selfie"
            hint="A clear photo of your face holding your ID"
            value={selfie}
            onChange={onSelfie}
            existingUrl={uploadUrl(existingSelfieUrl) ?? undefined}
          />
        </>
      )}

      {tier === 'TIER_3' && (
        <>
          <Input
            label="Proof of address URL"
            placeholder="https://…"
            hint="Link to a utility bill or bank statement"
            value={proofOfAddressUrl}
            onChange={(e) => onProofOfAddressUrl(e.target.value)}
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
              onChange={(e) => onSourceOfFunds(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
        </>
      )}
    </>
  );
}

export default function KycPage() {
  const { refresh } = useAuth();

  const [data, setData] = useState<KycStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wasPending, setWasPending] = useState(false);

  // Upgrade form state
  const [selectedTier, setSelectedTier] = useState<KycTier>('TIER_2');
  const [upgradePassport, setUpgradePassport] = useState<File | null>(null);
  const [upgradeNationalId, setUpgradeNationalId] = useState<File | null>(null);
  const [upgradeSelfie, setUpgradeSelfie] = useState<File | null>(null);
  const [upgradeProofOfAddressUrl, setUpgradeProofOfAddressUrl] = useState('');
  const [upgradeSourceOfFunds, setUpgradeSourceOfFunds] = useState('');
  const [upgradeSubmitting, setUpgradeSubmitting] = useState(false);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);

  // Update-documents form state (for all approved users, any tier)
  const [updatePassport, setUpdatePassport] = useState<File | null>(null);
  const [updateNationalId, setUpdateNationalId] = useState<File | null>(null);
  const [updateSelfie, setUpdateSelfie] = useState<File | null>(null);
  const [updateProofOfAddressUrl, setUpdateProofOfAddressUrl] = useState('');
  const [updateSourceOfFunds, setUpdateSourceOfFunds] = useState('');
  const [updateSubmitting, setUpdateSubmitting] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const status = await kycApi.getStatus();
      setData(status);
      setSelectedTier(initialSelectedTier(status));

      if (status.verification) {
        setUpgradeProofOfAddressUrl(
          status.verification.proofOfAddressUrl ?? '',
        );
        setUpgradeSourceOfFunds(status.verification.sourceOfFunds ?? '');
        setUpdateProofOfAddressUrl(status.verification.proofOfAddressUrl ?? '');
        setUpdateSourceOfFunds(status.verification.sourceOfFunds ?? '');
      }
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Failed to load verification status.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const shouldPoll =
      data?.status === 'PENDING' ||
      data?.latestApplication?.status === 'PENDING';
    if (shouldPoll) {
      const intervalId = window.setInterval(async () => {
        try {
          const status = await kycApi.getStatus();
          setData(status);
        } catch {
          // ignore polling errors and retry
        }
      }, 5000);
      return () => window.clearInterval(intervalId);
    }
    return undefined;
  }, [data?.status, data?.latestApplication?.status]);

  // Shared validation + submit logic. tierOverride is always passed explicitly
  // so we never depend on React state that may not have flushed yet.
  const submitKyc = async (
    tier: KycTier,
    files: {
      passport: File | null;
      nationalId: File | null;
      selfie: File | null;
    },
    extra: { proofOfAddressUrl: string; sourceOfFunds: string },
    setErr: (e: string | null) => void,
    setOk: (v: boolean) => void,
    setBusy: (v: boolean) => void,
  ) => {
    setErr(null);
    setOk(false);

    const isApprovedTierUpgrade =
      data?.status === 'APPROVED' &&
      data.verification != null &&
      TIER_ORDER[tier] > TIER_ORDER[data.tier];

    if (tier !== 'TIER_1' && !isApprovedTierUpgrade) {
      const hasIdDoc =
        files.passport ||
        files.nationalId ||
        data?.verification?.passportUrl ||
        data?.verification?.nationalIdUrl;
      if (!hasIdDoc) {
        setErr('Please upload a passport or national ID.');
        return;
      }
      const hasSelfie = files.selfie || data?.verification?.selfieUrl;
      if (!hasSelfie) {
        setErr('Please upload a selfie.');
        return;
      }
    }

    if (tier === 'TIER_3') {
      const hasProof =
        extra.proofOfAddressUrl.trim() || data?.verification?.proofOfAddressUrl;
      const hasFunds =
        extra.sourceOfFunds.trim() || data?.verification?.sourceOfFunds;
      if (!hasProof) {
        setErr('Proof of address URL is required for Tier 3.');
        return;
      }
      if (!hasFunds) {
        setErr('Source of funds description is required for Tier 3.');
        return;
      }
    }

    setBusy(true);
    try {
      const payload: SubmitKycPayload = {
        tier,
        passport: files.passport ?? undefined,
        nationalId: files.nationalId ?? undefined,
        selfie: files.selfie ?? undefined,
        proofOfAddressUrl:
          extra.proofOfAddressUrl.trim() ||
          data?.verification?.proofOfAddressUrl ||
          undefined,
        sourceOfFunds:
          extra.sourceOfFunds.trim() ||
          data?.verification?.sourceOfFunds ||
          undefined,
      };

      if (!payload.passport && data?.verification?.passportUrl) {
        payload.passportUrl = data.verification.passportUrl.startsWith('http')
          ? data.verification.passportUrl
          : (uploadUrl(data.verification.passportUrl) ?? undefined);
      }
      if (!payload.nationalId && data?.verification?.nationalIdUrl) {
        payload.nationalIdUrl = data.verification.nationalIdUrl.startsWith(
          'http',
        )
          ? data.verification.nationalIdUrl
          : (uploadUrl(data.verification.nationalIdUrl) ?? undefined);
      }
      if (!payload.selfie && data?.verification?.selfieUrl) {
        payload.selfieUrl = data.verification.selfieUrl.startsWith('http')
          ? data.verification.selfieUrl
          : (uploadUrl(data.verification.selfieUrl) ?? undefined);
      }

      await kycApi.submit(payload);
      setOk(true);
      await load();
      await refresh();
    } catch (err) {
      setErr(
        err instanceof ApiError
          ? err.message
          : 'Submission failed. Please try again.',
      );
    } finally {
      setBusy(false);
    }
  };

  const handleUpgradeSubmit = () =>
    submitKyc(
      selectedTier,
      {
        passport: upgradePassport,
        nationalId: upgradeNationalId,
        selfie: upgradeSelfie,
      },
      {
        proofOfAddressUrl: upgradeProofOfAddressUrl,
        sourceOfFunds: upgradeSourceOfFunds,
      },
      setUpgradeError,
      setUpgradeSuccess,
      setUpgradeSubmitting,
    );

  // Always submits with the user's current approved tier — never an upgrade tier.
  const handleUpdateSubmit = (currentTier: KycTier) =>
    submitKyc(
      currentTier,
      {
        passport: updatePassport,
        nationalId: updateNationalId,
        selfie: updateSelfie,
      },
      {
        proofOfAddressUrl: updateProofOfAddressUrl,
        sourceOfFunds: updateSourceOfFunds,
      },
      setUpdateError,
      setUpdateSuccess,
      setUpdateSubmitting,
    );

  if (loading) {
    return (
      <div>
        <PageHeader
          title="Verification"
          description="Complete KYC to unlock higher transfer limits."
        />
        <LoadingBlock label="Loading verification status…" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <PageHeader title="Verification" />
        <ErrorBlock message={error ?? 'Something went wrong.'} onRetry={load} />
      </div>
    );
  }

  const verification = data.verification;
  const application = data.latestApplication ?? null;
  const isApproved = data.status === 'APPROVED';
  const hasPendingUpgrade = application?.status === 'PENDING';
  const rejectedUpgrade = application?.status === 'REJECTED' && isApproved;
  const hasPendingReview = data.status === 'PENDING' && verification !== null;
  const showNewSubmissionForm = !isApproved && !hasPendingReview;
  const canUpgrade = isApproved && data.tier !== 'TIER_3' && !hasPendingUpgrade;
  // Show update-documents for ALL approved users regardless of tier.
  const canUpdateDocuments = isApproved;
  const reuseIdentityForUpgrade =
    isApproved &&
    selectedTier === 'TIER_3' &&
    hasExistingIdentityDocs(verification);

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
              <Badge tone={statusTone(data.status)}>
                {humanize(data.status)}
              </Badge>
              <Badge tone="neutral">{tierLabel(data.tier)}</Badge>
            </div>
            {rejectedUpgrade && application?.rejectionReason && (
              <Alert tone="error">
                <strong>
                  Upgrade to {tierLabel(application.tier)} declined:
                </strong>{' '}
                {application.rejectionReason} You remain verified at{' '}
                {tierLabel(data.tier)}.
              </Alert>
            )}
            {!rejectedUpgrade &&
              verification?.rejectionReason &&
              !isApproved && (
                <Alert tone="error">
                  <strong>Rejected:</strong> {verification.rejectionReason}
                </Alert>
              )}
            {hasPendingUpgrade && (
              <Alert tone="info">
                Your upgrade to {tierLabel(application!.tier)} is under review.
                You can continue sending at your current {tierLabel(data.tier)}{' '}
                limit.
              </Alert>
            )}
            {hasPendingReview && !hasPendingUpgrade && (
              <Alert tone="info">
                Your documents are under review. We&apos;ll notify you once
                approved.
              </Alert>
            )}
            {isApproved && (
              <Alert tone="success">
                Your identity is verified. You can send transfers up to your
                tier limit.
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

      {/* ── First-time / rejected submission form ── */}
      {showNewSubmissionForm && (
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
                  current={data.tier === tier.tier && isApproved}
                  onSelect={() => setSelectedTier(tier.tier)}
                />
              ))}
            </div>
          </div>

          {selectedTier !== 'TIER_1' ? (
            <Card>
              <CardHeader>
                <CardTitle>Identity documents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {upgradeError && <Alert tone="error">{upgradeError}</Alert>}
                {upgradeSuccess && (
                  <Alert tone="success">
                    Documents submitted successfully. Your verification is now
                    pending review.
                  </Alert>
                )}
                <DocumentFields
                  tier={selectedTier}
                  passport={upgradePassport}
                  onPassport={setUpgradePassport}
                  nationalId={upgradeNationalId}
                  onNationalId={setUpgradeNationalId}
                  selfie={upgradeSelfie}
                  onSelfie={setUpgradeSelfie}
                  proofOfAddressUrl={upgradeProofOfAddressUrl}
                  onProofOfAddressUrl={setUpgradeProofOfAddressUrl}
                  sourceOfFunds={upgradeSourceOfFunds}
                  onSourceOfFunds={setUpgradeSourceOfFunds}
                  existingPassportUrl={verification?.passportUrl}
                  existingNationalIdUrl={verification?.nationalIdUrl}
                  existingSelfieUrl={verification?.selfieUrl}
                />
                <Button
                  onClick={() => void handleUpgradeSubmit()}
                  loading={upgradeSubmitting}
                  size="lg"
                >
                  Submit for review
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8">
                <EmptyBlock
                  title="Tier 1 — Basic verification"
                  description="Your email and phone from registration satisfy Tier 1 requirements. Submit to activate your $500/month limit."
                  action={
                    <Button
                      onClick={() => void handleUpgradeSubmit()}
                      loading={upgradeSubmitting}
                    >
                      Activate Tier 1
                    </Button>
                  }
                />
                {upgradeError && (
                  <div className="mt-4">
                    <Alert tone="error">{upgradeError}</Alert>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* ── Upgrade to a higher tier (approved users who aren't at TIER_3) ── */}
      {canUpgrade && (
        <>
          <div>
            <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
              Upgrade verification tier
            </h2>
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
              You are currently verified at {tierLabel(data.tier)}. Upgrade to
              access higher transfer limits.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {data.tiers
                .filter((t) => TIER_ORDER[t.tier] > TIER_ORDER[data.tier])
                .map((t) => (
                  <TierCard
                    key={t.tier}
                    info={t}
                    selected={selectedTier === t.tier}
                    current={false}
                    onSelect={() => setSelectedTier(t.tier)}
                  />
                ))}
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Upgrade requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {upgradeError && <Alert tone="error">{upgradeError}</Alert>}
              {upgradeSuccess && (
                <Alert tone="success">
                  Upgrade request submitted. Your documents are now pending
                  review.
                </Alert>
              )}
              <DocumentFields
                tier={selectedTier}
                passport={upgradePassport}
                onPassport={setUpgradePassport}
                nationalId={upgradeNationalId}
                onNationalId={setUpgradeNationalId}
                selfie={upgradeSelfie}
                onSelfie={setUpgradeSelfie}
                proofOfAddressUrl={upgradeProofOfAddressUrl}
                onProofOfAddressUrl={setUpgradeProofOfAddressUrl}
                sourceOfFunds={upgradeSourceOfFunds}
                onSourceOfFunds={setUpgradeSourceOfFunds}
                existingPassportUrl={verification?.passportUrl}
                existingNationalIdUrl={verification?.nationalIdUrl}
                existingSelfieUrl={verification?.selfieUrl}
                reuseExistingIdentity={reuseIdentityForUpgrade}
              />
              <Button
                onClick={() => void handleUpgradeSubmit()}
                loading={upgradeSubmitting}
                size="lg"
                disabled={TIER_ORDER[selectedTier] <= TIER_ORDER[data.tier]}
              >
                {TIER_ORDER[selectedTier] <= TIER_ORDER[data.tier]
                  ? 'Select a higher tier'
                  : `Upgrade to ${tierLabel(selectedTier)}`}
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {/* ── Update documents (ALL approved users, at their current tier) ── */}
      {canUpdateDocuments && (
        <Card>
          <CardHeader>
            <CardTitle>Update documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {updateError && <Alert tone="error">{updateError}</Alert>}
            {updateSuccess && (
              <Alert tone="success">
                Documents updated successfully. Your updates are now pending
                review.
              </Alert>
            )}
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Update the documents on file for your current{' '}
              {tierLabel(data.tier)} verification. Leave a field empty to keep
              the existing document.
            </p>
            <DocumentFields
              tier={data.tier}
              passport={updatePassport}
              onPassport={setUpdatePassport}
              nationalId={updateNationalId}
              onNationalId={setUpdateNationalId}
              selfie={updateSelfie}
              onSelfie={setUpdateSelfie}
              proofOfAddressUrl={updateProofOfAddressUrl}
              onProofOfAddressUrl={setUpdateProofOfAddressUrl}
              sourceOfFunds={updateSourceOfFunds}
              onSourceOfFunds={setUpdateSourceOfFunds}
              existingPassportUrl={verification?.passportUrl}
              existingNationalIdUrl={verification?.nationalIdUrl}
              existingSelfieUrl={verification?.selfieUrl}
            />
            {/* Pass data.tier explicitly — never depends on selectedTier state. */}
            <Button
              onClick={() => void handleUpdateSubmit(data.tier)}
              loading={updateSubmitting}
              size="lg"
            >
              Update documents
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Submitted documents (pending review) ── */}
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
                  <li className="text-slate-400">
                    Tier 1 submission — no documents required.
                  </li>
                )}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
