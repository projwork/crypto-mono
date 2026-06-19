"use client";

import Link from "next/link";
import { use } from "react";
import { TransferStatusBadge } from "@/components/transfers/TransferStatusBadge";
import { TransferTimeline } from "@/components/transfers/TransferTimeline";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ErrorBlock, LoadingBlock, PageHeader } from "@/components/ui/PageStates";
import { useTransferTimeline } from "@/lib/hooks/useTransferTimeline";
import { formatAsset, formatEtb, humanize } from "@/lib/utils";
import { formatDateTime } from "@/lib/transfers/status";
import { ConversionRatesPanel } from "@/components/transfers/ConversionRatesPanel";

export default function TransferDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { transfer, loading, error, reload, reached, currentStatus, sseConnected } =
    useTransferTimeline(id);

  if (loading) {
    return (
      <div>
        <PageHeader title="Transfer details" />
        <LoadingBlock label="Loading transfer…" />
      </div>
    );
  }

  if (error || !transfer) {
    return (
      <div>
        <PageHeader title="Transfer details" />
        <ErrorBlock message={error ?? "Transfer not found."} onRetry={reload} />
      </div>
    );
  }

  const payoutDetail =
    transfer.beneficiary.payoutMethod === "TELEBIRR"
      ? transfer.beneficiary.phoneNumber
      : `${transfer.beneficiary.bank} · ${transfer.beneficiary.accountNumber}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title={transfer.reference}
        description={`Created ${formatDateTime(transfer.createdAt)}`}
        action={
          <Link href="/transfers">
            <Button variant="secondary">All transfers</Button>
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Summary */}
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle>Summary</CardTitle>
              <TransferStatusBadge status={transfer.status} />
            </CardHeader>
            <CardContent className="space-y-4">
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Recipient</dt>
                  <dd className="text-right font-medium">{transfer.beneficiary.fullName}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Payout method</dt>
                  <dd className="text-right">{humanize(transfer.beneficiary.payoutMethod)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Account</dt>
                  <dd className="text-right font-mono text-xs">{payoutDetail}</dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <dt className="text-slate-500">You sent</dt>
                  <dd className="font-medium">{formatAsset(transfer.sendAmount, transfer.asset)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Fee</dt>
                  <dd>
                    {formatAsset(transfer.feeCrypto, transfer.asset)} ({formatEtb(transfer.feeEtb)})
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="font-medium text-slate-700 dark:text-slate-300">Recipient gets</dt>
                  <dd className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">
                    {formatEtb(transfer.payoutEtb)}
                  </dd>
                </div>
              </dl>

              {transfer.failureReason && (
                <Alert tone="error">{transfer.failureReason}</Alert>
              )}

              {transfer.depositAddress && transfer.status === "AWAITING_CRYPTO" && (
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                  <p className="text-xs font-medium text-slate-500">Deposit address</p>
                  <code className="mt-1 block break-all text-xs text-slate-700 dark:text-slate-300">
                    {transfer.depositAddress.address}
                  </code>
                </div>
              )}
            </CardContent>
          </Card>

          {transfer.txHash && (
            <Card>
              <CardContent className="p-4 text-xs">
                <p className="text-slate-500">Blockchain tx</p>
                <code className="mt-1 block break-all text-slate-600 dark:text-slate-400">
                  {transfer.txHash}
                </code>
              </CardContent>
            </Card>
          )}

          <ConversionRatesPanel asset={transfer.asset} />
        </div>

        {/* Live timeline */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle>Transaction timeline</CardTitle>
            <span className="flex items-center gap-1.5 text-xs text-slate-400">
              <span
                className={`h-2 w-2 rounded-full ${sseConnected ? "bg-indigo-500 animate-pulse" : "bg-slate-300"}`}
              />
              {sseConnected ? "Live" : "Offline"}
            </span>
          </CardHeader>
          <CardContent>
            <TransferTimeline currentStatus={currentStatus} reached={reached} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
