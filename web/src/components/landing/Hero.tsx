"use client";

import { Button } from "@/components/ui/Button";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden lg:pt-48 lg:pb-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
              Remit with Confidence. <br />
              <span className="text-indigo-600">Send USDC to Ethiopia in Minutes.</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-600 max-w-xl">
              The bridge between global liquidity and local impact. DiasporaPay provides institutional-grade security for your remittances using stablecoins and real-time bank settlement.
            </p>
            <div className="mt-10 flex items-center gap-x-6">
              <Link href="/register">
                <Button size="lg" className="bg-slate-950 text-white hover:bg-slate-800 h-14 px-8 rounded-xl text-md font-semibold">
                  Get Started
                </Button>
              </Link>
              <button className="flex items-center gap-2 text-md font-semibold text-slate-900 hover:text-indigo-600">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                    <path d="M8 5v14l11-7L8 5z" />
                  </svg>
                </div>
                View Demo
              </button>
            </div>
          </div>

          <div className="relative">
            {/* Background Decorative Blob */}
            <div className="absolute -inset-4 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 blur-3xl rounded-full" />
            
            {/* Calculator Mockup */}
            <div className="relative glass rounded-3xl p-8 shadow-2xl border border-white/40">
              <div className="flex items-center justify-between mb-8">
                <span className="text-sm font-semibold text-slate-900">Live Exchange Rate</span>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold ring-1 ring-inset ring-indigo-600/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  Live Market
                </span>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-slate-500 font-medium">You Send</span>
                    <span className="text-xs text-slate-900 font-semibold">USD Coin</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold text-slate-900">1,000</span>
                    <span className="text-lg font-bold text-slate-400">USDC</span>
                  </div>
                </div>

                <div className="flex justify-center -my-2 relative z-10">
                  <div className="bg-slate-900 p-2 rounded-full ring-4 ring-white">
                    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-white">
                      <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-slate-500 font-medium">Recipient Receives</span>
                    <span className="text-xs text-slate-900 font-semibold">Birr</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold text-slate-900">114,450.00</span>
                    <span className="text-lg font-bold text-slate-400">ETB</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-200 flex items-center justify-between text-xs font-medium text-slate-500">
                <span>Rate: 1 USDC = 114.45 ETB</span>
                <span>Fee: 0.25 USDC</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
