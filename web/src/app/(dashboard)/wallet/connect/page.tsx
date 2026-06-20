"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BrowserProvider } from "ethers";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Card, CardContent } from "@/components/ui/Card";
import Link from "next/link";
import { ApiError } from "@/lib/api/client";
import { walletApi } from "@/lib/api/wallet";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function MetaMaskConnectPage() {
  const router = useRouter();
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Check MetaMask installation on mount
  useEffect(() => {
    const checkMetaMask = () => {
      setIsMetaMaskInstalled(typeof window.ethereum !== "undefined");
    };

    if (typeof window !== "undefined") {
      checkMetaMask();
    }
  }, []);

  const connectWallet = async () => {
    if (!isMetaMaskInstalled) {
      setError("MetaMask is not installed.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Request accounts from MetaMask
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found in MetaMask");
      }

      const walletAddress = accounts[0];

      // 2. Send wallet address to backend
      const wallet = await walletApi.connect(walletAddress);

      if (!wallet.active) {
        throw new Error("Wallet connection failed on backend");
      }

      // 3. Show success state
      setSuccess(true);

      // 4. Redirect to dashboard after brief delay
      await new Promise((resolve) => setTimeout(resolve, 1500));
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Wallet connection error:", err);

      // Handle specific error cases
      if (err.code === "ACTION_REJECTED") {
        setError("You rejected the MetaMask connection request.");
      } else if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(err?.message || "Failed to connect wallet. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Loading state while checking MetaMask
  if (isMetaMaskInstalled === null) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Connecting Wallet
          </h2>
          <p className="mt-3 text-slate-500 dark:text-slate-400 font-medium">
            Checking for MetaMask installation…
          </p>
        </div>

        <Card className="bg-white dark:bg-slate-900">
          <CardContent className="flex flex-col items-center justify-center gap-6 py-12">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600 dark:border-slate-700 dark:border-t-indigo-400" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Please wait while we check your setup…
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // MetaMask NOT installed state
  if (!isMetaMaskInstalled) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Install MetaMask Extension
          </h2>
          <p className="mt-3 text-slate-500 dark:text-slate-400 font-medium">
            To securely connect your funds to DiasporaPay, you need to set up a Web3 browser
            extension.
          </p>
        </div>

        <Card className="bg-white dark:bg-slate-900">
          <CardContent className="flex flex-col items-center gap-6 py-10">
            <div className="relative">
              <div className="h-24 w-24 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-inner">
                <span className="text-5xl">🦊</span>
              </div>
              <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-rose-500 border-4 border-white dark:border-slate-900 flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-4 w-4 text-white"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path d="M12 4v16m8-8H4" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            <div className="text-center space-y-2">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                MetaMask Not Found
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xs">
                The MetaMask browser extension is required to connect your wallet securely.
              </p>
            </div>

            <a
              href="https://chromewebstore.google.com/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full"
            >
              <Button size="lg" className="w-full rounded-xl h-14 font-bold">
                Install MetaMask on Chrome
              </Button>
            </a>

            <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center leading-relaxed max-w-sm">
              Please refresh this page after installing and completing your wallet setup inside
              the extension.
            </p>
          </CardContent>
        </Card>

        <p className="mt-8 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
          Already set up?{" "}
          <button
            onClick={() => setIsMetaMaskInstalled(null)}
            className="font-bold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            Check again
          </button>
        </p>
      </div>
    );
  }

  // MetaMask IS installed - Ready to Connect state
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          {success ? "Wallet Connected!" : "Connect Your Wallet"}
        </h2>
        <p className="mt-3 text-slate-500 dark:text-slate-400 font-medium">
          {success
            ? "Your wallet has been securely connected to DiasporaPay. Redirecting…"
            : "Securely connect your MetaMask wallet to access DiasporaPay."}
        </p>
      </div>

      <Card className="bg-white dark:bg-slate-900">
        <CardContent className="flex flex-col items-center gap-6 py-10">
          <div className="relative">
            <div className="h-24 w-24 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50 shadow-inner">
              <span className="text-5xl">🦊</span>
            </div>
            {!success ? (
              <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-indigo-500 border-4 border-white dark:border-slate-900 flex items-center justify-center animate-pulse">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-4 w-4 text-white"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path d="m5 12 5 5 9-11" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            ) : (
              <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-emerald-500 border-4 border-white dark:border-slate-900 flex items-center justify-center animate-pulse">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-4 w-4 text-white"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path d="m5 12 5 5 9-11" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
          </div>

          <div className="text-center space-y-2">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              MetaMask Wallet
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500">
              Fast, secure, and decentralized access.
            </p>
          </div>

          {error && <Alert tone="error">{error}</Alert>}

          {!success ? (
            <>
              <Button
                onClick={connectWallet}
                loading={loading}
                disabled={loading || success}
                size="lg"
                className="w-full rounded-xl h-14 font-bold"
              >
                Connect & Verify Wallet
              </Button>

              <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center leading-relaxed max-w-sm">
                By connecting your wallet, you agree to DiasporaPay's{" "}
                <Link href="/terms" className="font-bold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400">
                  Terms of Service
                </Link>
              </p>
            </>
          ) : (
            <div className="space-y-3 w-full">
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 p-4 text-center">
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                  ✓ Connection Successful
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                  Your wallet is now connected. Redirecting to dashboard…
                </p>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div className="h-full bg-indigo-600 animate-pulse" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {!success && (
        <p className="mt-8 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
          Need help?{" "}
          <Link
            href="/support"
            className="font-bold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            Contact support
          </Link>
        </p>
      )}
    </div>
  );
}
