"use client";

import type { ReactNode } from "react";
import Link from "next/link";

const HIGHLIGHTS = [
  "Funds delivered in as little as 15 minutes",
  "Save up to 80% vs traditional wire services",
  "Enterprise-grade multi-signature custody",
];

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2 bg-white">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-slate-950 p-10 text-white lg:flex">
        {/* Animated background elements */}
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-[400px] w-[400px] rounded-full bg-indigo-600/20 blur-[100px] animate-pulse"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-20 h-[400px] w-[400px] rounded-full bg-blue-600/10 blur-[100px]"
          aria-hidden
        />

        <div className="relative">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 shadow-lg shadow-indigo-500/20">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-white">
                <path
                  d="M12 2v20M7 6l5-4 5 4M7 18l5 4 5-4"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="text-lg font-bold tracking-tight">LagerPay</span>
          </Link>
        </div>

        <div className="relative max-w-sm">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold mb-6 uppercase tracking-wider">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
            Institutional Grade
          </div>
          <h1 className="text-3xl font-bold leading-tight tracking-tight">
            Send Money Home <br />
            <span className="text-indigo-400 font-extrabold">Smarter, Faster, Safer.</span>
          </h1>
          <p className="mt-4 text-sm text-slate-400 leading-relaxed">
            The future of remittances to Ethiopia. LagerPay bridges global digital finance with local access for the diaspora.
          </p>
          <ul className="mt-8 space-y-4">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-center gap-3 text-slate-300 text-xs font-semibold">
                <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400">
                  <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3">
                    <path
                      d="m5 12 5 5 9-11"
                      stroke="currentColor"
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex items-center justify-between border-t border-white/5 pt-8">
           <p className="text-[10px] text-slate-500 font-bold tracking-widest flex items-center gap-4 uppercase">
            <span>Blockchain Secured</span>
            <span className="h-1 w-1 rounded-full bg-slate-700" />
            <span>Real-time Settlement</span>
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-4 py-12 sm:px-8 bg-slate-50/30">
        <div className="w-full max-w-md">
           <div className="lg:hidden mb-10 flex justify-center">
             <Link href="/" className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
                  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                    <path d="M12 2v20M7 6l5-4 5 4M7 18l5 4 5-4" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="text-lg font-bold tracking-tight text-slate-900">LagerPay</span>
              </Link>
           </div>
           {children}
        </div>
      </div>
    </div>
  );
}