"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BrowserProvider } from "ethers";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import Link from "next/link";

declare global {
    interface Window {
    ethereum?: any;
  }
}

export default function MetaMaskAuthPage() {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const connectWallet = async () => {
    if (typeof window.ethereum === "undefined") {
      setStatus("MetaMask is not installed. Please install it to continue.");
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const provider = new BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      // In a real app, you'd send this address + a signature to the backend.
      // For now, we simulate a successful auth and redirect.
      console.log("Authenticated with MetaMask:", address);
      
      // Simulate backend delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      router.replace("/dashboard");
    } catch (error: any) {
      console.error("Error connecting wallet:", error);
      setStatus(error?.message || "Connection failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
          Sign in with Wallet
        </h2>
        <p className="mt-3 text-slate-500 font-medium">
          Connect your MetaMask to access DiasporaPay.
        </p>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="h-24 w-24 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100 shadow-inner">
               <span className="text-5xl">🦊</span>
            </div>
            <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-indigo-500 border-4 border-white flex items-center justify-center animate-pulse">
               <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-white">
                  <path d="m5 12 5 5 9-11" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
               </svg>
            </div>
          </div>

          <div className="text-center space-y-2">
            <p className="text-sm font-semibold text-slate-900">MetaMask Wallet</p>
            <p className="text-xs text-slate-500">Fast, secure, and decentralized access.</p>
          </div>

          {status && <Alert tone="error">{status}</Alert>}

          <Button 
            onClick={connectWallet} 
            loading={loading}
            size="lg" 
            className="w-full bg-slate-950 text-white hover:bg-slate-800 rounded-xl h-14 font-bold"
          >
            Connect & Sign In
          </Button>

          <p className="text-[11px] text-slate-400 text-center leading-relaxed">
            By connecting your wallet, you agree to DiasporaPay's <br />
            <Link href="/terms" className="font-bold text-slate-500 hover:text-indigo-600">Terms of Service</Link>
          </p>
        </div>
      </div>

      <p className="mt-8 text-center text-sm font-medium text-slate-500">
        Prefer email?{" "}
        <Link
          href="/login"
          className="font-bold text-indigo-600 hover:text-indigo-500"
        >
          Sign in with email
        </Link>
      </p>
    </div>
  );
}
