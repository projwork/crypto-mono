"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { BrowserProvider, formatEther, parseUnits } from "ethers";
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
import { walletApi } from "@/lib/api/wallet";
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

const DEFAULT_AMOUNT_BY_ASSET: Record<AssetType, string> = {
  USDC: "100",
  USDT: "100",
  ETH: "0.001",
};

const PAYOUT_PIPELINE_STATUSES = [
  "BLOCKCHAIN_CONFIRMED",
  "SWISS_FUNDS_RECEIVED",
  "FX_CONVERTED",
  "PAYOUT_PROCESSING",
  "PAYOUT_SENT",
] as const;

const PAYOUT_STATUS_MESSAGES: Record<string, string> = {
  BLOCKCHAIN_CONFIRMED: "Crypto deposit confirmed. Routing funds to Swiss liquidity corridor…",
  SWISS_FUNDS_RECEIVED: "Swiss liquidity received. Converting to Ethiopian Birr…",
  FX_CONVERTED: "FX conversion complete. Initiating local ETB payout…",
  PAYOUT_PROCESSING: "Sending ETB to your recipient's bank or mobile wallet…",
  PAYOUT_SENT: "ETB payout sent. Finalizing transfer…",
  COMPLETED: "Transfer completed. Ethiopian Birr delivered successfully.",
};

async function getMetaMaskChain(): Promise<"ETHEREUM" | "BSC" | "POLYGON" | "ARBITRUM" | "OPTIMISM"> {
  if (typeof window === "undefined" || !window.ethereum) return "ETHEREUM";
  try {
    const chainId = await window.ethereum.request({ method: "eth_chainId" });
    switch (chainId) {
      case "0x38":
        return "BSC";
      case "0x89":
        return "POLYGON";
      case "0xa4b1":
        return "ARBITRUM";
      case "0xa":
        return "OPTIMISM";
      default:
        return "ETHEREUM";
    }
  } catch {
    return "ETHEREUM";
  }
}

function getNetworkLabel(chainId: bigint): string {
  switch (chainId) {
    case 1n:
      return "Ethereum Mainnet";
    case 11155111n:
      return "Sepolia testnet";
    case 5n:
      return "Goerli testnet";
    default:
      return `network (chain ID ${chainId})`;
  }
}

function formatWalletSendError(err: unknown, amountEth: string, networkLabel: string): string {
  const message = err instanceof Error ? err.message : "";
  const code = (err as { code?: string })?.code;

  if (
    code === "INSUFFICIENT_FUNDS" ||
    message.includes("insufficient funds") ||
    message.includes("INSUFFICIENT_FUNDS")
  ) {
    return (
      `Your MetaMask wallet does not have enough ETH on ${networkLabel}. ` +
      `This transfer needs ${amountEth} ETH plus gas fees. ` +
      `Switch MetaMask to Sepolia testnet, fund your wallet from a faucet ` +
      `(e.g. https://sepoliafaucet.com or https://faucet.quicknode.com/ethereum/sepolia), then try again.`
    );
  }

  if (code === "ACTION_REJECTED") {
    return "You rejected the transaction in MetaMask.";
  }

  return err instanceof ApiError
    ? err.message
    : err instanceof Error
      ? err.message
      : "Outbound transfer failed.";
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
  const [amountInput, setAmountInput] = useState(DEFAULT_AMOUNT_BY_ASSET.USDC);
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
  const [payoutProcessing, setPayoutProcessing] = useState(false);
  const [downloadingReceipt, setDownloadingReceipt] = useState(false);
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

  useEffect(() => {
    if (transfer?.status === "COMPLETED") {
      setStep(activeSteps.length);
    }
  }, [transfer?.status, activeSteps.length]);

  const handleAssetChange = (next: AssetType) => {
    setAsset(next);
    setAmountInput(DEFAULT_AMOUNT_BY_ASSET[next]);
  };

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
      const wallets = await walletApi.list();
      if (wallets.length > 0) {
        setConnectedAddress(wallets[0].address);
        setIsConnected(true);
        setStep(4);
      } else {
        setIsConnected(false);
      }
    } catch (err) {
      setIsConnected(false);
      setWalletError(err instanceof ApiError ? err.message : "Could not load connected wallets.");
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
      const chain = await getMetaMaskChain();

      await walletApi.connect(address, chain);

      setConnectedAddress(address);
      setIsConnected(true);
      setStep(4);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      setWalletError(
        code === "ACTION_REJECTED"
          ? "User rejected MetaMask authorization."
          : err instanceof ApiError
            ? err.message
            : "Failed to connect wallet to the platform.",
      );
    } finally {
      setConnectingMetaMask(false);
    }
  };

  const handleAdminMockConfirmation = async () => {
    if (!transfer) return;
    setSendingCrypto(true);
    setSendError(null);
    try {
      const updated = await transfersApi.simulateDeposit(transfer.id);
      setTransfer(updated);
      setStep(activeSteps.length - 1);
    } catch (err) {
      setSendError(err instanceof ApiError ? err.message : "Could not simulate deposit.");
    } finally {
      setSendingCrypto(false);
    }
  };

  const runEtbPayout = async (transferId: string) => {
    setPayoutProcessing(true);
    setSendError(null);
    try {
      const updated = await transfersApi.continuePayout(transferId);
      setTransfer(updated);
    } catch (err) {
      setSendError(err instanceof ApiError ? err.message : "ETB payout processing failed.");
      const latest = await transfersApi.get(transferId);
      setTransfer(latest);
    } finally {
      setPayoutProcessing(false);
    }
  };

  const handleDownloadReceipt = async () => {
    if (!transfer) return;
    setDownloadingReceipt(true);
    setSendError(null);
    try {
      await transfersApi.downloadReceiptPdf(transfer.id, transfer.reference);
    } catch (err) {
      setSendError(err instanceof ApiError ? err.message : "Could not download receipt PDF.");
    } finally {
      setDownloadingReceipt(false);
    }
  };

  const handleMetaMaskSendBroadcast = async () => {
    if (!transfer || !connectedAddress) return;
    if (typeof window === "undefined" || !window.ethereum) {
      setSendError("MetaMask is not available.");
      return;
    }

    setSendingCrypto(true);
    setSendError(null);

    try {
      const step1 = await walletApi.send(transfer.id, connectedAddress);
      const sendConfig = step1.send;

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const transactionParameters: {
        to: string;
        value: string;
      } = {
        to: sendConfig.toAddress,
        value: "0",
      };

      if (sendConfig.asset === "ETH") {
        const value = parseUnits(sendConfig.amount, "ether");
        transactionParameters.value = value.toString();

        const network = await provider.getNetwork();
        const networkLabel = getNetworkLabel(network.chainId);
        const balance = await provider.getBalance(connectedAddress);
        const gasBuffer = parseUnits("0.0001", "ether");

        if (balance < value + gasBuffer) {
          throw new Error(
            `Insufficient ETH on ${networkLabel}. Wallet balance: ${formatEther(balance)} ETH. ` +
              `Required: ${sendConfig.amount} ETH plus ~0.0001 ETH for gas. ` +
              `Use Sepolia testnet and get free test ETH from a faucet before retrying.`,
          );
        }

        if (network.chainId === 1n) {
          throw new Error(
            "MetaMask is on Ethereum Mainnet. Switch to Sepolia testnet before sending a test transfer.",
          );
        }
      } else {
        throw new Error(
          "Live MetaMask send currently supports ETH only. Choose ETH as the asset, or use Sepolia test ETH.",
        );
      }

      const txResponse = await signer.sendTransaction(transactionParameters);

      await walletApi.send(transfer.id, connectedAddress, txResponse.hash);

      const confirmed = await transfersApi.get(transfer.id);
      setTransfer(confirmed);
      setStep(5);
      await runEtbPayout(transfer.id);
    } catch (err: unknown) {
      const amountEth =
        transfer.asset === "ETH" ? String(transfer.sendAmount) : "0";
      let networkLabel = "your current network";
      try {
        const provider = new BrowserProvider(window.ethereum!);
        const network = await provider.getNetwork();
        networkLabel = getNetworkLabel(network.chainId);
      } catch {
        /* ignore */
      }
      setSendError(formatWalletSendError(err, amountEth, networkLabel));
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

      <WizardStepper steps={activeSteps} current={step} completed={transfer?.status === "COMPLETED"} />

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
                        onClick={() => handleAssetChange(a)}
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
                  placeholder={DEFAULT_AMOUNT_BY_ASSET[asset]}
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

      {/* Step 5 — Crypto Deposit */}
      {((step === 4 && !isAdmin) || (step === 3 && isAdmin)) && transfer?.status === "AWAITING_CRYPTO" && (
        <div className="mx-auto max-w-lg space-y-6">
          <Card className="overflow-hidden">
            <CardContent className="space-y-5 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Corridor Reference ID</p>
                  <p className="font-mono font-semibold text-slate-900 dark:text-white">{transfer.reference}</p>
                </div>
                <Badge tone={statusTone(transfer.status)}>{humanize(transfer.status)}</Badge>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Inbound Transfer Dispatch</h3>
                <Alert tone="info">
                  {isAdmin
                    ? "Admin view override activated. Confirming payload directly bypassing wallet hardware validation steps."
                    : `You will be prompted to broadcast ${formatAsset(transfer.sendAmount, transfer.asset)} safely to the ingestion bridge.`}
                </Alert>
                {transfer.asset === "ETH" && !isAdmin && (
                  <Alert tone="info">
                    Live wallet send uses real ETH on your MetaMask network. Use <strong>Sepolia testnet</strong>,
                    fund your wallet with free test ETH from a faucet, and keep the send amount small (e.g. 0.001 ETH).
                  </Alert>
                )}
              </div>

              <dl className="space-y-2 border-t border-slate-100 pt-4 text-sm dark:border-slate-800">
                <div className="flex justify-between"><p className="text-slate-500">Final Local Delivery Target</p><p className="font-semibold text-indigo-600 dark:text-indigo-400">{formatEtb(transfer.payoutEtb)}</p></div>
                <div className="flex justify-between"><p className="text-slate-500">Verified Recipient Legal Name</p><p>{transfer.beneficiary.fullName}</p></div>
              </dl>
              {sendError && <Alert tone="danger">{sendError}</Alert>}
            </CardContent>
          </Card>

          <Button
            onClick={isAdmin ? handleAdminMockConfirmation : handleMetaMaskSendBroadcast}
            loading={sendingCrypto}
            size="lg"
            className="w-full font-medium tracking-wide bg-indigo-600 text-white"
          >
            {isAdmin ? "Simulate Inbound Deposit Approval" : "Initiate Wallet Outbound Transfer"}
          </Button>
        </div>
      )}

      {/* Step 6 — ETB Delivery / Completion */}
      {((step >= 5 && !isAdmin) || (isAdmin && transfer && transfer.status !== "AWAITING_CRYPTO")) && transfer && (
        <div className="mx-auto max-w-lg space-y-6">
          <Card className="overflow-hidden">
            <CardContent className="space-y-5 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Corridor Reference ID</p>
                  <p className="font-mono font-semibold text-slate-900 dark:text-white">{transfer.reference}</p>
                </div>
                <Badge tone={statusTone(transfer.status)}>{humanize(transfer.status)}</Badge>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-500">ETB Delivery</h3>
                {transfer.status === "COMPLETED" ? (
                  <Alert tone="success">
                    {PAYOUT_STATUS_MESSAGES.COMPLETED} Your recipient received {formatEtb(transfer.payoutEtb)}.
                  </Alert>
                ) : transfer.status === "FAILED" ? (
                  <Alert tone="danger">Transfer failed during ETB payout processing.</Alert>
                ) : (
                  <Alert tone="info">
                    {PAYOUT_STATUS_MESSAGES[transfer.status] ?? "Processing Ethiopian Birr payout…"}
                  </Alert>
                )}
                {(payoutProcessing || PAYOUT_PIPELINE_STATUSES.includes(transfer.status as (typeof PAYOUT_PIPELINE_STATUSES)[number])) &&
                  transfer.status !== "COMPLETED" &&
                  transfer.status !== "FAILED" && (
                    <LoadingBlock label="Processing ETB corridor settlement…" />
                  )}
              </div>

              <dl className="space-y-2 border-t border-slate-100 pt-4 text-sm dark:border-slate-800">
                <div className="flex justify-between"><p className="text-slate-500">Final Local Delivery Target</p><p className="font-semibold text-indigo-600 dark:text-indigo-400">{formatEtb(transfer.payoutEtb)}</p></div>
                <div className="flex justify-between"><p className="text-slate-500">Verified Recipient Legal Name</p><p>{transfer.beneficiary.fullName}</p></div>
                {transfer.payoutReference && (
                  <div className="flex justify-between"><p className="text-slate-500">Payout Reference</p><p className="font-mono text-xs">{transfer.payoutReference}</p></div>
                )}
              </dl>
              {sendError && <Alert tone="danger">{sendError}</Alert>}
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3">
            {transfer.status === "COMPLETED" && (
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                  className="flex-1 w-full bg-emerald-600 text-white"
                  loading={downloadingReceipt}
                  onClick={handleDownloadReceipt}
                >
                  Download Execution Receipt (PDF)
                </Button>
                <Link href="/dashboard" className="flex-1">
                  <Button variant="secondary" size="lg" className="w-full">Return to Terminal View</Button>
                </Link>
              </div>
            )}
            {transfer.status === "FAILED" && (
              <Link href="/transfers" className="w-full">
                <Button variant="secondary" size="lg" className="w-full">View Transfer History</Button>
              </Link>
            )}
          </div>

          {PAYOUT_PIPELINE_STATUSES.includes(transfer.status as (typeof PAYOUT_PIPELINE_STATUSES)[number]) && (
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