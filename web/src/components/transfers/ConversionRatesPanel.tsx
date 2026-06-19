"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { conversionsApi } from "@/lib/api/conversions";
import type { AssetType, ChfToEtbRate, CryptoToChfRate } from "@/lib/api/types";
import { cn, formatAsset, formatEtb, formatUsd } from "@/lib/utils";

interface ConversionRatesPanelProps {
  asset: AssetType;
  className?: string;
}

export function ConversionRatesPanel({ asset, className }: ConversionRatesPanelProps) {
  const [cryptoToChf, setCryptoToChf] = useState<CryptoToChfRate | null>(null);
  const [chfToEtb, setChfToEtb] = useState<ChfToEtbRate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setCryptoToChf(null);
    setChfToEtb(null);

    const load = async () => {
      try {
        const [cryptoRate, etbRate] = await Promise.all([
          conversionsApi.getCryptoToChfRate(asset),
          conversionsApi.getChfToEtbRate(),
        ]);
        if (cancelled) return;
        setCryptoToChf(cryptoRate);
        setChfToEtb(etbRate);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Unable to load conversion rates.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [asset]);

  return (
    <Card className={cn("border-slate-200 dark:border-slate-700", className)}>
      <CardHeader>
        <CardTitle className="text-base">Live conversion rates</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && (
          <p className="text-sm text-slate-500">Loading live rates…</p>
        )}

        {!loading && error && (
          <p className="text-sm text-rose-500">{error}</p>
        )}

        {!loading && !error && cryptoToChf && chfToEtb && (
          <div className="space-y-4 text-sm">
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/80">
              <p className="text-sm text-slate-500">Crypto → CHF</p>
              <p className="mt-2 font-semibold text-slate-900 dark:text-white">
                1 {cryptoToChf.asset} = {cryptoToChf.chfRate.toFixed(6)} CHF
              </p>
              <p className="text-slate-500">
                USD Price: {formatUsd(cryptoToChf.usdRate)}
              </p>
              <p className="text-slate-500">
                1 USD = {cryptoToChf.usdToChf.toFixed(6)} CHF
              </p>    
              <p className="mt-3 text-xs text-slate-400">
                Source: {cryptoToChf.source}
              </p>
              <p className="text-xs text-slate-400">
                As of {new Date(cryptoToChf.fetchedAt).toLocaleString()}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/80">
              <p className="text-sm text-slate-500">CHF → ETB</p>
              <p className="mt-2 font-semibold text-slate-900 dark:text-white">
                1 {chfToEtb.from} = {formatEtb(chfToEtb.rate)}
              </p>
              <p className="text-slate-500">1 USD = {chfToEtb.usdToEtb.toFixed(4)} ETB</p>
              <p className="mt-3 text-xs text-slate-400">Source: {chfToEtb.source}</p>
              <p className="text-xs text-slate-400">
                As of {new Date(chfToEtb.fetchedAt).toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
