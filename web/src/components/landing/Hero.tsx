"use client";

import { Button } from "@/components/ui/Button";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative pt-24 pb-16 overflow-hidden lg:pt-36 lg:pb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl leading-tight">
              Send Money Home <br />
              <span className="text-indigo-600">Smarter, Faster, Safer.</span>
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-600 max-w-lg">
              The future of remittances to Ethiopia. LagerPay bridges global digital finance with local access, providing institutional-grade security and real-time settlement.
            </p>
            <div className="mt-8 flex items-center gap-x-4">
              <Link href="/register">
                <Button className="bg-slate-950 text-white hover:bg-slate-800 h-11 px-6 rounded-lg text-sm font-semibold">
                  Get Started
                </Button>
              </Link>
              {/* Fixed: Added Link wrapper to provide navigation for the Demo action */}
              {/* <Link href="/demo">
                <button className="flex items-center gap-2 text-sm font-semibold text-slate-900 hover:text-indigo-600">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3">
                      <path d="M8 5v14l11-7L8 5z" />
                    </svg>
                  </div>
                  View Demo
                </button>
              </Link> */}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 blur-3xl rounded-full" />
            <div className="relative glass rounded-2xl p-6 shadow-xl border border-white/40">
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Example Transfer</span>
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold ring-1 ring-inset ring-emerald-600/20">
                  Live Rate
                </span>
              </div>

              <div className="space-y-3">
                <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">You Send</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-xl font-bold text-slate-900">1,000</span>
                    <span className="text-sm font-bold text-slate-400">USDC</span>
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Recipient Receives</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-xl font-bold text-slate-900">114,450.00</span>
                    <span className="text-sm font-bold text-slate-400">ETB</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                <span>1 USDC = 114.45 ETB</span>
                <span className="text-indigo-600">Fee: 0.25 USDC</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}