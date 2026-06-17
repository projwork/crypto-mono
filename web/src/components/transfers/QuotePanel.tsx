import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { TransferQuote } from "@/lib/api/types";
import { cn, formatAsset, formatEtb } from "@/lib/utils";

interface QuotePanelProps {
  quote: TransferQuote | null;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

/** Displays the live transfer quote in PRD §6 Step 4 format. */
export function QuotePanel({ quote, loading, error, className }: QuotePanelProps) {
  const ratePer100 =
    quote && quote.amount > 0
      ? (100 / quote.amount) * quote.grossEtb
      : quote
        ? quote.usdToEtb * 100
        : null;

  return (
    <Card className={cn("border-indigo-100 dark:border-indigo-500/20", className)}>
      <CardHeader>
        <CardTitle className="text-base">Live quote</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex items-center gap-2 py-4 text-sm text-slate-500">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            Updating quote…
          </div>
        )}

        {!loading && error && (
          <p className="text-sm text-rose-500">{error}</p>
        )}

        {!loading && !error && !quote && (
          <p className="text-sm text-slate-400">
            Select a beneficiary and enter an amount to see your quote.
          </p>
        )}

        {!loading && !error && quote && (
          <div className="space-y-4">
            <div className="rounded-xl bg-indigo-50 px-4 py-3 dark:bg-indigo-500/10">
              <p className="text-2xl font-semibold text-slate-900 dark:text-white">
                {formatAsset(quote.amount, quote.asset)}
              </p>
              <p className="mt-1 text-lg text-indigo-700 dark:text-indigo-400">
                = {formatEtb(quote.grossEtb)}
              </p>
              {ratePer100 !== null && (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  100 {quote.asset} ≈ {formatEtb(ratePer100)}
                </p>
              )}
            </div>

            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Fee</dt>
                <dd className="font-medium text-slate-900 dark:text-slate-100">
                  {formatAsset(quote.feeCrypto, quote.asset)}{" "}
                  <span className="text-slate-400">({formatEtb(quote.feeEtb)})</span>
                </dd>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-2 dark:border-slate-800">
                <dt className="font-medium text-slate-700 dark:text-slate-300">Recipient gets</dt>
                <dd className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">
                  {formatEtb(quote.payoutEtb)}
                </dd>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <dt>Rate</dt>
                <dd>1 USD = {quote.usdToEtb} ETB</dd>
              </div>
            </dl>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
