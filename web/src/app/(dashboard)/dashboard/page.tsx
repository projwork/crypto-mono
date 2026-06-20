"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { BrowserProvider } from "ethers";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { useAuth } from "@/lib/auth/AuthContext";
import { humanize } from "@/lib/utils";

function kycTone(status: string): "success" | "warning" | "danger" {
  if (status === "APPROVED") return "success";
  if (status === "REJECTED") return "danger";
  return "warning";
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [walletStatus, setWalletStatus] = useState<string | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);

  if (!user) return null;

  // Check if the user is an admin
  const isAdmin = user.role?.toLowerCase() === "admin";

  // Dynamic Sequential Carousel Timer Configuration
  useEffect(() => {
    if (isAdmin) return;

    let timer: NodeJS.Timeout;

    if (currentSlide === 0) {
      // Stay on the primary Hero slide for 5 minutes
      timer = setTimeout(() => {
        setCurrentSlide(1);
      }, 300000); 
    } else if (currentSlide === 1) {
      // Stay on the secondary Wallet slide for exactly 6 seconds
      timer = setTimeout(() => {
        setCurrentSlide(0);
      }, 6000);
    }

    return () => clearTimeout(timer);
  }, [currentSlide, isAdmin]);

  // Integrated MetaMask Connection Logic
  const handleMetaMaskConnect = async () => {
    if (typeof window.ethereum === "undefined") {
      setWalletStatus("MetaMask is not installed. Please install it to continue.");
      return;
    }

    setWalletLoading(true);
    setWalletStatus(null);

    try {
      const provider = new BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      console.log("Authenticated with MetaMask:", address);
      setConnectedAddress(address);
      setWalletStatus(`Successfully connected: ${address.slice(0, 6)}...${address.slice(-4)}`);
      
      // Dynamic sliding effect back to main hero once connected
      setTimeout(() => setCurrentSlide(0), 2000);
    } catch (error: any) {
      console.error("Error connecting wallet:", error);
      setWalletStatus(error?.message || "Connection failed. Please try again.");
    } finally {
      setWalletLoading(false);
    }
  };

  // Base Quick Actions
  const baseActions = [
    {
      title: "Send money",
      description: "Start a new crypto-to-Birr transfer.",
      href: "/transfers/new",
      onClick: null,
    },
    {
      title: "Connect with MetaMask ➔",
      description: "Link your Web3 wallet immediately.",
      href: "#",
      onClick: (e: React.MouseEvent) => {
        e.preventDefault();
        // Slides to the second card view and triggers MetaMask
        setCurrentSlide(1);
        handleMetaMaskConnect();
      },
    },
    {
      title: "Complete verification",
      description: "Raise your limits with KYC.",
      href: "/kyc",
      onClick: null,
    },
  ];

  // Filter out MetaMask action if user is admin
  const QUICK_ACTIONS = isAdmin 
    ? baseActions.filter(action => !action.title.includes("MetaMask"))
    : baseActions;

  return (
    <div className="space-y-6">
      
      {/* Dynamic Paginated Slider Sections */}
      <div className="relative overflow-hidden rounded-xl">
        <div 
          className="flex transition-transform duration-500 ease-in-out" 
          style={{ transform: `translateX(-${isAdmin ? 0 : currentSlide * 100}%)` }}
        >
          {/* Slide 1: Main Hero */}
          <div className="w-full shrink-0 pr-1">
            <Card className="overflow-hidden border-0 bg-gradient-to-br from-indigo-600 to-teal-700 text-white">
              <CardContent className="flex flex-col gap-4 p-8 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-indigo-100">Good to see you,</p>
                  <h1 className="mt-1 text-2xl font-semibold">
                    {user.firstName} {user.lastName}
                  </h1>
                  <p className="mt-2 max-w-md text-sm text-indigo-50/90">
                    Send crypto and deliver Ethiopian Birr to family and friends in just a few steps.
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <Link href="/transfers/new">
                    <Button variant="secondary" size="lg" className="w-full bg-white text-indigo-700 hover:bg-indigo-50">
                      Send money
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Slide 2: Wallet Pagination Card (Hidden entirely if Admin) */}
          {!isAdmin && (
            <div className="w-full shrink-0 pl-1">
              <Card className="overflow-hidden border-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white">
                <CardContent className="flex flex-col gap-4 py-8 px-10 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-4 mt-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🦊</span>
                      <h2 className="text-xl font-bold text-white">Connect with your wallet</h2>
                    </div>
                    <p className="max-w-md text-sm text-slate-300">
                      Securely verify and connect your decentralized funds. We only support MetaMask for now.
                    </p>
                    {walletStatus && (
                      <div className="mt-2 max-w-sm text-black text-xs">
                        <Alert tone={connectedAddress ? "success" : "error"}>{walletStatus}</Alert>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 min-w-[160px]">
                    <Button 
                      onClick={handleMetaMaskConnect}
                      loading={walletLoading}
                      variant="secondary" 
                      size="lg" 
                      className="bg-orange-500 text-white hover:bg-orange-600 border-0 font-semibold"
                    >
                      {connectedAddress ? "Connected" : "Connect MetaMask"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Carousel Indicators (Hidden entirely if Admin) */}
        {!isAdmin && (
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
            <button 
              onClick={() => setCurrentSlide(0)} 
              className={`h-1.5 w-1.5 rounded-full transition-all ${currentSlide === 0 ? "bg-white w-3" : "bg-white/40"}`} 
            />
            <button 
              onClick={() => setCurrentSlide(1)} 
              className={`h-1.5 w-1.5 rounded-full transition-all ${currentSlide === 1 ? "bg-white w-3" : "bg-white/40"}`} 
            />
          </div>
        )}
      </div>

      {/* Account status */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Verification</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <Badge tone={kycTone(user.kycStatus)}>{humanize(user.kycStatus)}</Badge>
            <span className="text-sm text-slate-500">{humanize(user.kycTier)}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 dark:text-slate-300">{user.email}</p>
            <p className="mt-1 text-xs text-slate-400">{user.country}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Role</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge tone="info">{humanize(user.role)}</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
          Quick actions
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {QUICK_ACTIONS.map((action, idx) => {
            const content = (
              <Card className="h-full transition-shadow hover:shadow-md cursor-pointer">
                <CardContent className="p-5">
                  <p className="font-medium text-slate-900 dark:text-slate-100">{action.title}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {action.description}
                  </p>
                </CardContent>
              </Card>
            );

            return action.onClick ? (
              <div key={idx} onClick={action.onClick}>
                {content}
              </div>
            ) : (
              <Link key={action.href} href={action.href}>
                {content}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent transfers */}
      <Card>
        <CardHeader>
          <CardTitle>Recent transfers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-6 w-6">
                <path d="M22 2 11 13" strokeLinecap="round" strokeLinejoin="round" />
                <path d="m22 2-7 20-4-9-9-4Z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                No transfers yet
              </p>
              <p className="text-sm text-slate-400">Your transfers will appear here once you send.</p>
            </div>
            <Link href="/transfers/new">
              <Button size="sm">Start a transfer</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}