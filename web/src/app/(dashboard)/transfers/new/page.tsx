"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { QuotePanel } from "@/components/transfers/QuotePanel";
import { WizardStepper } from "@/components/transfers/WizardStepper";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { EmptyBlock, ErrorBlock, LoadingBlock, PageHeader } from "@/components/ui/PageStates";
import { ApiError } from "@/lib/api/client";
import { beneficiariesApi } from "@/lib/api/beneficiaries";
import { transfersApi } from "@/lib/api/transfers";
import type { AssetType, PublicBeneficiary, PublicTransfer, TransferQuote } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/AuthContext";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { cn, formatAsset, formatEtb, humanize } from "@/lib/utils";

const STEPS = [
  { id: "beneficiary", label: "Recipient" },
  { id: "amount", label: "Amount" },
  { id: "review", label: "Review" },
  { id: "deposit", label: "Deposit" },
];

const ASSETS: AssetType[] = ["USDC", "USDT", "ETH"];

function payoutDetail(b: PublicBeneficiary): string {
  if (b.payoutMethod === "TELEBIRR") return b.phoneNumber ?? "";
  return `${b.bank ?? ""} · ${b.accountNumber ?? ""}`;
}

function statusTone(status: string): "success" | "warning" | "danger" | "info" | "neutral" {
  if (status === "COMPLETED") return "success";
  if (status === "FAILED" || status === "REVERSED") return "danger";
  if (status === "AWAITING_CRYPTO") return "warning";
  return "info";
}

export default function NewTransferPage() {
  const { user } = useAuth();
  const [step, setStep] = useState(0);

  const [beneficiaries, setBeneficiaries] = useState<PublicBeneficiary[]>([]);
  const [loadingBeneficiaries, setLoadingBeneficiaries] = useState(true);
  const [beneficiariesError, setBeneficiariesError] = useState<string | null>(null);

  const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState<string | null>(null);
  const [asset, setAsset] = useState<AssetType>("USDC");
  const [amountInput, setAmountInput] = useState("100");

  const debouncedAmount = useDebouncedValue(amountInput, 400);

  const [quote, setQuote] = useState<TransferQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [transfer, setTransfer] = useState<PublicTransfer | null>(null);

  const [simulating, setSimulating] = useState(false);
  const [simulateError, setSimulateError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const selectedBeneficiary = beneficiaries.find((b) => b.id === selectedBeneficiaryId) ?? null;
  const parsedAmount = Number.parseFloat(debouncedAmount);
  const amountValid = Number.isFinite(parsedAmount) && parsedAmount > 0;

  const loadBeneficiaries = useCallback(async () => {
    setLoadingBeneficiaries(true);
    setBeneficiariesError(null);
    try {
      const list = await beneficiariesApi.list();
      setBeneficiaries(list);
      if (list.length === 1) setSelectedBeneficiaryId(list[0].id);
    } catch (err) {
      setBeneficiariesError(
        err instanceof ApiError ? err.message : "Failed to load beneficiaries.",
      );
    } finally {
      setLoadingBeneficiaries(false);
    }
  }, []);

  useEffect(() => {
    void loadBeneficiaries();
  }, [loadBeneficiaries]);

  // Live quote — updates as user types (debounced amount)
  useEffect(() => {
    if (!selectedBeneficiaryId || !amountValid || step > 2) return;

    let cancelled = false;
    setQuoteLoading(true);
    setQuoteError(null);

    transfersApi
      .quote({ asset, amount: parsedAmount, beneficiaryId: selectedBeneficiaryId })
      .then((q) => {
        if (!cancelled) setQuote(q);
      })
      .catch((err) => {
        if (!cancelled) {
          setQuote(null);
          setQuoteError(err instanceof ApiError ? err.message : "Could not fetch quote.");
        }
      })
      .finally(() => {
        if (!cancelled) setQuoteLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedBeneficiaryId, asset, parsedAmount, amountValid, step]);

  const handleCreate = async () => {
    if (!selectedBeneficiaryId || !amountValid || !quote) return;
    setCreating(true);
    setCreateError(null);
    try {
      const created = await transfersApi.create({
        asset,
        amount: parsedAmount,
        beneficiaryId: selectedBeneficiaryId,
      });
      setTransfer(created);
      setStep(3);
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : "Failed to create transfer.");
    } finally {
      setCreating(false);
    }
  };

  const handleSimulate = async () => {
    if (!transfer) return;
    setSimulating(true);
    setSimulateError(null);
    try {
      const updated = await transfersApi.simulateDeposit(transfer.id);
      setTransfer(updated);
    } catch (err) {
      setSimulateError(err instanceof ApiError ? err.message : "Simulation failed.");
    } finally {
      setSimulating(false);
    }
  };

  const copyAddress = async () => {
    const addr = transfer?.depositAddress?.address;
    if (!addr) return;
    await navigator.clipboard.writeText(addr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const kycBlocked = user?.kycStatus !== "APPROVED";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Send money"
        description="Convert crypto to Ethiopian Birr and deliver to your recipient."
      />

      {kycBlocked && (
        <Alert tone="error">
          Identity verification is required before sending.{" "}
          <Link href="/kyc" className="font-medium underline underline-offset-2">
            Complete verification
          </Link>
        </Alert>
      )}

      <WizardStepper steps={STEPS} current={step} />

      {/* Step 1 — Beneficiary */}
      {step === 0 && (
        <div className="space-y-4">
          {loadingBeneficiaries && <LoadingBlock label="Loading recipients…" />}
          {!loadingBeneficiaries && beneficiariesError && (
            <ErrorBlock message={beneficiariesError} onRetry={loadBeneficiaries} />
          )}
          {!loadingBeneficiaries && !beneficiariesError && beneficiaries.length === 0 && (
            <Card>
              <CardContent>
                <EmptyBlock
                  title="No beneficiaries yet"
                  description="Add a recipient before sending money."
                  action={
                    <Link href="/beneficiaries">
                      <Button>Add beneficiary</Button>
                    </Link>
                  }
                />
              </CardContent>
            </Card>
          )}
          {!loadingBeneficiaries && !beneficiariesError && beneficiaries.length > 0 && (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                {beneficiaries.map((b) => {
                  const selected = selectedBeneficiaryId === b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedBeneficiaryId(b.id)}
                      className={cn(
                        "rounded-xl border p-4 text-left transition-all",
                        selected
                          ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20 dark:bg-emerald-500/10"
                          : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-slate-900 dark:text-white">{b.fullName}</p>
                        {b.isFavorite && <Badge tone="warning">Favorite</Badge>}
                      </div>
                      <p className="mt-1 text-sm text-slate-500">{humanize(b.payoutMethod)}</p>
                      <p className="mt-0.5 font-mono text-xs text-slate-400">{payoutDetail(b)}</p>
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-end gap-3">
                <Link href="/beneficiaries">
                  <Button variant="secondary">Manage beneficiaries</Button>
                </Link>
                <Button
                  disabled={!selectedBeneficiaryId}
                  onClick={() => setStep(1)}
                >
                  Continue
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Step 2 — Amount + live quote */}
      {step === 1 && selectedBeneficiary && (
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="space-y-5 lg:col-span-3">
            <Card>
              <CardContent className="space-y-5 p-6">
                <div>
                  <p className="text-sm text-slate-500">Sending to</p>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {selectedBeneficiary.fullName}
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                    Asset
                  </p>
                  <div className="flex gap-2">
                    {ASSETS.map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => setAsset(a)}
                        className={cn(
                          "rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                          asset === a
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300",
                        )}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>

                <Input
                  label="Amount to send"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="100"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  hint={`Enter the ${asset} amount you will deposit.`}
                />
              </CardContent>
            </Card>

            <div className="flex justify-between gap-3">
              <Button variant="secondary" onClick={() => setStep(0)}>
                Back
              </Button>
              <Button
                disabled={!amountValid || !quote || quoteLoading || !!quoteError}
                onClick={() => setStep(2)}
              >
                Review transfer
              </Button>
            </div>
          </div>

          <div className="lg:col-span-2">
            <QuotePanel
              quote={quote}
              loading={quoteLoading}
              error={quoteError}
              className="sticky top-24"
            />
          </div>
        </div>
      )}

      {/* Step 3 — Review & confirm */}
      {step === 2 && selectedBeneficiary && quote && (
        <div className="mx-auto max-w-lg space-y-6">
          <Card>
            <CardContent className="space-y-4 p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Review your transfer
              </h2>

              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Recipient</dt>
                  <dd className="font-medium">{selectedBeneficiary.fullName}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Payout</dt>
                  <dd className="font-mono text-xs">{payoutDetail(selectedBeneficiary)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">You send</dt>
                  <dd className="font-medium">{formatAsset(quote.amount, quote.asset)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Gross ETB</dt>
                  <dd>{formatEtb(quote.grossEtb)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Fee</dt>
                  <dd>
                    {formatAsset(quote.feeCrypto, quote.asset)} ({formatEtb(quote.feeEtb)})
                  </dd>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                  <dt className="font-medium">Recipient gets</dt>
                  <dd className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatEtb(quote.payoutEtb)}
                  </dd>
                </div>
              </dl>

              {createError && <Alert tone="error">{createError}</Alert>}
            </CardContent>
          </Card>

          <div className="flex justify-between gap-3">
            <Button variant="secondary" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button
              onClick={handleCreate}
              loading={creating}
              disabled={kycBlocked}
              size="lg"
            >
              Confirm & create transfer
            </Button>
          </div>
        </div>
      )}

      {/* Step 4 — Deposit address + simulate */}
      {step === 3 && transfer && (
        <div className="mx-auto max-w-lg space-y-6">
          <Card className="overflow-hidden">
            <CardContent className="space-y-5 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Reference</p>
                  <p className="font-mono font-semibold text-slate-900 dark:text-white">
                    {transfer.reference}
                  </p>
                </div>
                <Badge tone={statusTone(transfer.status)}>{humanize(transfer.status)}</Badge>
              </div>

              <Alert tone="info">
                Send exactly{" "}
                <strong>{formatAsset(transfer.sendAmount, transfer.asset)}</strong> to the address
                below on the Ethereum network.
              </Alert>

              {transfer.depositAddress && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {transfer.asset} deposit address
                  </p>
                  <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                    <code className="flex-1 break-all text-xs text-slate-700 dark:text-slate-300">
                      {transfer.depositAddress.address}
                    </code>
                    <Button variant="secondary" size="sm" onClick={copyAddress}>
                      {copied ? "Copied!" : "Copy"}
                    </Button>
                  </div>
                  <p className="text-xs text-slate-400">Network: Ethereum</p>
                </div>
              )}

              <dl className="space-y-2 border-t border-slate-100 pt-4 text-sm dark:border-slate-800">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Recipient gets</dt>
                  <dd className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatEtb(transfer.payoutEtb)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Recipient</dt>
                  <dd>{transfer.beneficiary.fullName}</dd>
                </div>
              </dl>

              {simulateError && <Alert tone="error">{simulateError}</Alert>}

              {transfer.status === "COMPLETED" && (
                <Alert tone="success">
                  Transfer completed! {transfer.beneficiary.fullName} received{" "}
                  {formatEtb(transfer.payoutEtb)}.
                </Alert>
              )}

              {transfer.status === "FAILED" && transfer.failureReason && (
                <Alert tone="error">{transfer.failureReason}</Alert>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            {transfer.status === "AWAITING_CRYPTO" && (
              <Button
                onClick={handleSimulate}
                loading={simulating}
                size="lg"
                className="sm:flex-1"
              >
                I&apos;ve deposited (simulate)
              </Button>
            )}
            {(transfer.status === "COMPLETED" || transfer.status === "FAILED") && (
              <div className="flex flex-col gap-3 sm:flex-1">
                <Link href={`/transfers/${transfer.id}`}>
                  <Button size="lg" className="w-full">
                    View live timeline
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="secondary" size="lg" className="w-full">
                    Back to dashboard
                  </Button>
                </Link>
              </div>
            )}
            {transfer.status !== "AWAITING_CRYPTO" &&
              transfer.status !== "COMPLETED" &&
              transfer.status !== "FAILED" && (
                <p className="text-center text-sm text-slate-500">
                  Processing your transfer…
                </p>
              )}
          </div>

          {transfer.status !== "AWAITING_CRYPTO" &&
            transfer.status !== "COMPLETED" &&
            transfer.status !== "FAILED" && (
              <ProcessingPoller transferId={transfer.id} onUpdate={setTransfer} />
            )}
        </div>
      )}
    </div>
  );
}

/** Polls transfer status while orchestration runs (post-simulate). */
function ProcessingPoller({
  transferId,
  onUpdate,
}: {
  transferId: string;
  onUpdate: (t: PublicTransfer) => void;
}) {
  useEffect(() => {
    let cancelled = false;

    const tick = async () => {
      if (cancelled) return;
      try {
        const t = await transfersApi.get(transferId);
        if (cancelled) return;
        onUpdate(t);
        if (t.status === "COMPLETED" || t.status === "FAILED") return;
      } catch {
        /* ignore transient errors */
      }
      if (!cancelled) setTimeout(tick, 1500);
    };

    const timer = setTimeout(tick, 1500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [transferId, onUpdate]);

  return null;
}
