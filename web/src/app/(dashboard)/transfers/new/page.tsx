"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { BrowserProvider, parseUnits } from "ethers";
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

declare global {
  interface Window {
    ethereum?: any;
  }
}

const STANDARD_STEPS = [
  { id: "beneficiary", label: "Recipient" },
  { id: "amount", label: "Amount" },
  { id: "review", label: "Review" },
  { id: "wallet_check", label: "Wallet Custody" },
  { id: "deposit", label: "Crypto Deposit" },
  { id: "payout", label: "ETB Delivery" },
];

const ADMIN_STEPS = [
  { id: "beneficiary", label: "Recipient" },
  { id: "amount", label: "Amount" },
  { id: "review", label: "Review" },
  { id: "deposit", label: "Deposit" },
];

const ASSETS: AssetType[] = ["USDC", "USDT", "ETH"];

interface WalletSendParams {
  transferId: string;
  reference: string;
  fromAddress: string;
  toAddress: string;
  amount: string;
  asset: string;
  chain: string;
  network: string;
}

function payoutDetail(b: PublicBeneficiary): string {
  if (b.payoutMethod === "TELEBIRR") return b.phoneNumber ?? "";
  return `${b.bank ?? ""} · ${b.accountNumber ?? ""}`;
}

function statusTone(status: string): "success" | "danger" | "info" | "neutral" {
  if (status === "COMPLETED" || status === "BLOCKCHAIN_CONFIRMED" || status === "FUNDS_RECEIVED") return "success";
  if (status === "FAILED" || status === "REVERSED") return "danger";
  if (status === "AWAITING_CRYPTO") return "neutral";
  return "info";
}

export default function NewTransferPage() {
  const { user } = useAuth();
  const [step, setStep] = useState(0);

  const isAdmin = user?.role === "ADMIN";
  const activeSteps = isAdmin ? ADMIN_STEPS : STANDARD_STEPS;

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

  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [checkingWallet, setCheckingWallet] = useState(false);
  const [connectingMetaMask, setConnectingMetaMask] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);

  const [sendingCrypto, setSendingCrypto] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

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
      setBeneficiariesError(err instanceof ApiError ? err.message : "Failed to load recipients.");
    } finally {
      setLoadingBeneficiaries(false);
    }
  }, []);

  useEffect(() => {
    void loadBeneficiaries();
  }, [loadBeneficiaries]);

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
      if (!isAdmin) {
        await verifyWalletConnection();
      }
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : "Failed to initiate transaction pipeline.");
    } finally {
      setCreating(false);
    }
  };

  const verifyWalletConnection = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      setIsConnected(false);
      return;
    }

    setCheckingWallet(true);
    setWalletError(null);
    try {
      const resp = await fetch("/api/wallet/me");
      if (!resp.ok) throw new Error();
      const payload = await resp.json();
      const accounts = payload.data?.wallets || payload.wallets || payload;

      if (Array.isArray(accounts) && accounts.length > 0) {
        // Handle database model objects vs standard strings
        const targetAddress = typeof accounts[0] === "object" ? accounts[0].address : accounts[0];
        setConnectedAddress(targetAddress);
        setIsConnected(true);
        setStep(4);
      } else {
        setIsConnected(false);
      }
    } catch (err) {
      setIsConnected(false);
    } finally {
      setCheckingWallet(false);
    }
  };

  const handleConnectWallet = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      setWalletError("MetaMask extension provider is missing or not installed.");
      return;
    }

    setConnectingMetaMask(true);
    setWalletError(null);
    try {
      const provider = new BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      if (address) {
        setConnectedAddress(address);
        setIsConnected(true);
        setStep(4); 
      } else {
        setWalletError("MetaMask connection handshake failed.");
      }
    } catch (err: any) {
      setWalletError(err.code === "ACTION_REJECTED" ? "User rejected interface authorization." : "Injected provider parsing failed.");
    } finally {
      setConnectingMetaMask(false);
    }
  };

  const handleAdminMockConfirmation = async () => {
    if (!transfer) return;
    setSendingCrypto(true);
    setSendError(null);
    try {
      // Trigger a direct update to move state to confirmed bypass signature rules
      setTransfer((prev) => {
        if (!prev) return null;
        return { ...prev, status: "BLOCKCHAIN_CONFIRMED" };
      });
    } catch (err) {
      setSendError("Could not update mock ledger states.");
    } finally {
      setSendingCrypto(false);
    }
  };

  const handleMetaMaskSendBroadcast = async () => {
    if (!transfer || !connectedAddress) return;
    setSendingCrypto(true);
    setSendError(null);

    try {
      const step1Resp = await fetch("/api/wallet/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transferId: transfer.id, fromAddress: connectedAddress })
      });

      const step1Data = await step1Resp.json();
      const sendConfig = step1Data.data?.send || step1Data.send;

      if (!sendConfig) {
        throw new Error("Target API route returned an invalid response envelope. Missing configuration context.");
      }

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      let transactionParameters: any = {
        to: sendConfig.toAddress,
        value: "0"
      };

      if (sendConfig.asset === "ETH") {
        transactionParameters.value = parseUnits(sendConfig.amount, "ether").toString();
      }

      const txResponse = await signer.sendTransaction(transactionParameters);
      
      await fetch("/api/wallet/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transferId: transfer.id,
          fromAddress: connectedAddress,
          txHash: txResponse.hash
        })
      });

      setTransfer((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          status: "BLOCKCHAIN_CONFIRMED",
          blockchainTxHash: txResponse.hash
        };
      });

      setStep(5);
    } catch (err: any) {
      setSendError(err.message || "Outbound processing execution rejected by network layers.");
    } finally {
      setSendingCrypto(false);
    }
  };

  const kycBlocked = user?.kycStatus !== "APPROVED";

  return (
    <div className="space-y-6">
      <PageHeader
        title={isAdmin ? "Admin Corridor Control Panel" : "Cross-Border Transfer"}
        description="Convert digital assets to local fiat currency efficiently via stable corridors."
      />

      {kycBlocked && (
        <Alert tone="danger">
          Identity verification is required before triggering corridor movement.{" "}
          <Link href="/kyc" className="font-medium underline underline-offset-2">Complete verification</Link>
        </Alert>
      )}

      <WizardStepper steps={activeSteps} current={step} />

      {/* Step 1 — Recipient Identification */}
      {step === 0 && (
        <div className="space-y-4">
          {loadingBeneficiaries && <LoadingBlock label="Loading ecosystem routing entities…" />}
          {!loadingBeneficiaries && beneficiariesError && <ErrorBlock message={beneficiariesError} onRetry={loadBeneficiaries} />}
          {!loadingBeneficiaries && !beneficiariesError && beneficiaries.length === 0 && (
            <Card>
              <CardContent>
                <EmptyBlock
                  title="No recipients configured"
                  description="Register a legal payout entry endpoint before initializing liquidity routing."
                  action={<Link href="/beneficiaries"><Button>Add beneficiary</Button></Link>}
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
                          ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/20 dark:bg-indigo-500/10"
                          : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-slate-900 dark:text-white">{b.fullName}</p>
                        {b.isFavorite && <Badge tone="neutral">Default</Badge>}
                      </div>
                      <p className="mt-1 text-sm text-slate-500">{humanize(b.payoutMethod)}</p>
                      <p className="mt-0.5 font-mono text-xs text-slate-400">{payoutDetail(b)}</p>
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-end gap-3">
                <Link href="/beneficiaries"><Button variant="secondary">Manage Beneficiaries</Button></Link>
                <Button disabled={!selectedBeneficiaryId} onClick={() => setStep(1)}>Continue</Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Step 2 — Amount Configuration */}
      {step === 1 && selectedBeneficiary && (
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="space-y-5 lg:col-span-3">
            <Card>
              <CardContent className="space-y-5 p-6">
                <div>
                  <p className="text-sm text-slate-500">Destination target</p>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {selectedBeneficiary.fullName} ({humanize(selectedBeneficiary.payoutMethod)})
                  </p>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Source Liquidity Asset</p>
                  <div className="flex gap-2">
                    {ASSETS.map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => setAsset(a)}
                        className={cn(
                          "rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                          asset === a ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300",
                        )}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
                <Input
                  label="Principal Volumetric Amount"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="100"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  hint={`Nominal asset quantity required for corridor entry quote calculations.`}
                />
              </CardContent>
            </Card>
            <div className="flex justify-between gap-3">
              <Button variant="secondary" onClick={() => setStep(0)}>Back</Button>
              <Button disabled={!amountValid || !quote || quoteLoading || !!quoteError} onClick={() => setStep(2)}>Review Transfer</Button>
            </div>
          </div>
          <div className="lg:col-span-2">
            <QuotePanel quote={quote} loading={quoteLoading} error={quoteError} className="sticky top-24" />
          </div>
        </div>
      )}

      {/* Step 3 — Review Summary */}
      {step === 2 && selectedBeneficiary && quote && (
        <div className="mx-auto max-w-lg space-y-6">
          <Card>
            <CardContent className="space-y-4 p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Corridor Clearing Summary</h2>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between"><p className="text-slate-500">Legal Recipient</p><p className="font-medium text-slate-500">{selectedBeneficiary.fullName}</p></div>
                <div className="flex justify-between"><p className="text-slate-500">Routing Path</p><p className="font-mono text-xs text-slate-500">{payoutDetail(selectedBeneficiary)}</p></div>
                <div className="flex justify-between"><p className="text-slate-500">Inbound Principal</p><p className="font-medium text-slate-500">{formatAsset(quote.amount, quote.asset)}</p></div>
                <div className="flex justify-between"><p className="text-slate-500">Base Value Parity</p><p className="text-slate-500">{formatEtb(quote.grossEtb)}</p></div>
                <div className="flex justify-between"><p className="text-slate-500">Corridor Operational Fee</p><p className="text-slate-500">{formatAsset(quote.feeCrypto, quote.asset)} ({formatEtb(quote.feeEtb)})</p></div>
                <div className="flex justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                  <p className="font-medium text-slate-500">Guaranteed Settlement Payout</p>
                  <p className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">{formatEtb(quote.payoutEtb)}</p>
                </div>
              </dl>
              {createError && <Alert tone="danger">{createError}</Alert>}
            </CardContent>
          </Card>
          <div className="flex justify-between gap-3">
            <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
            <Button onClick={handleCreate} loading={creating} disabled={kycBlocked} size="lg">Confirm & Generate Channel</Button>
          </div>
        </div>
      )}

      {/* Step 4 — Standard Web3 Custody Check */}
      {step === 3 && !isAdmin && (
        <div className="mx-auto max-w-md space-y-4">
          <Card>
            <CardContent className="p-6 text-center space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Web3 Identity Verification</h3>
              {checkingWallet && <LoadingBlock label="Scanning browser context signatures..." />}
              {!checkingWallet && isConnected ? (
                <div className="space-y-3 rounded-xl bg-emerald-50 p-4 border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30">
                  <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-400 flex items-center justify-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />Identity Node Authorized
                  </p>
                  <div className="text-[11px] font-mono text-slate-600 bg-white/60 dark:bg-slate-900/60 rounded p-2 border break-all">{connectedAddress}</div>
                </div>
              ) : (
                !checkingWallet && isConnected === false && (
                  <div className="space-y-4 pt-2">
                    <Alert tone="info">No active signer context discovered.</Alert>
                    <Button onClick={handleConnectWallet} loading={connectingMetaMask} className="w-full bg-orange-600 text-white font-semibold rounded-xl h-12">Connect MetaMask Node</Button>
                  </div>
                )
              )}
              {walletError && <Alert tone="danger">{walletError}</Alert>}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Final Step Channel / Deposit Processing Layout */}
      {((step >= 4 && !isAdmin) || (step === 3 && isAdmin)) && transfer && (
        <div className="mx-auto max-w-lg space-y-6">
          <Card className="overflow-hidden">
            <CardContent className="space-y-5 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Corridor Reference ID</p>
                  <p className="font-mono font-semibold text-slate-900 dark:text-white">{transfer.reference || "TX0001"}</p>
                </div>
                <Badge tone={statusTone(transfer.status)}>{humanize(transfer.status)}</Badge>
              </div>

              {transfer.status === "AWAITING_CRYPTO" && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Inbound Transfer Dispatch</h3>
                  <Alert tone="info">
                    {isAdmin ? "Admin view override activated. Confirming payload directly bypassing wallet hardware validation steps." : `You will be prompted to broadcast ${formatAsset(transfer.sendAmount, transfer.asset)} safely to the ingestion bridge.`}
                  </Alert>
                </div>
              )}

              {["COMPLETED", "PAYOUT_SENT", "FUNDS_RECEIVED", "BLOCKCHAIN_CONFIRMED"].includes(transfer.status as string) && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-500">Audit & Completion Receipt</h3>
                  <Alert tone="success">Terminal execution ledger state reached (<strong>{transfer.status}</strong>).</Alert>
                </div>
              )}

              <dl className="space-y-2 border-t border-slate-100 pt-4 text-sm dark:border-slate-800">
                <div className="flex justify-between"><p className="text-slate-500">Final Local Delivery Target</p><p className="font-semibold text-indigo-600 dark:text-indigo-400">{formatEtb(transfer.payoutEtb)}</p></div>
                <div className="flex justify-between"><p className="text-slate-500">Verified Recipient Legal Name</p><p>{transfer.beneficiary.fullName}</p></div>
              </dl>
              {sendError && <Alert tone="danger">{sendError}</Alert>}
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3">
            {transfer.status === "AWAITING_CRYPTO" && (
              <Button
                onClick={isAdmin ? handleAdminMockConfirmation : handleMetaMaskSendBroadcast}
                loading={sendingCrypto}
                size="lg"
                className="w-full font-medium tracking-wide bg-indigo-600 text-white"
              >
                {isAdmin ? "Simulate Inbound Deposit Approval" : "Initiate Wallet Outbound Transfer"}
              </Button>
            )}

            {["COMPLETED", "PAYOUT_SENT", "FUNDS_RECEIVED", "BLOCKCHAIN_CONFIRMED"].includes(transfer.status as string) && (
              <div className="flex flex-col gap-3 sm:flex-row">
                <a href={`/api/transfers/${transfer.id}/receipt`} download className="flex-1">
                  <Button size="lg" className="w-full bg-emerald-600 text-white">Download Execution Receipt</Button>
                </a>
                <Link href="/dashboard" className="flex-1"><Button variant="secondary" size="lg" className="w-full">Return to Terminal View</Button></Link>
              </div>
            )}
          </div>

          {!["AWAITING_CRYPTO", "FUNDS_RECEIVED", "PAYOUT_SENT", "COMPLETED", "FAILED", "BLOCKCHAIN_CONFIRMED"].includes(transfer.status as string) && (
            <ProcessingPoller transferId={transfer.id} onUpdate={setTransfer} />
          )}
        </div>
      )}
    </div>
  );
}

function ProcessingPoller({ transferId, onUpdate }: { transferId: string; onUpdate: (t: PublicTransfer) => void; }) {
  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      if (cancelled) return;
      try {
        const t = await transfersApi.get(transferId);
        if (cancelled) return;
        onUpdate(t);
        if (t.status === "COMPLETED" || t.status === "FAILED") return;
      } catch {}
      if (!cancelled) setTimeout(tick, 1500);
    };
    const timer = setTimeout(tick, 1500);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [transferId, onUpdate]);
  return null;
}