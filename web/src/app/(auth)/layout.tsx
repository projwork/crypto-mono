import type { ReactNode } from "react";
import Link from "next/link";

const HIGHLIGHTS = [
  "Deposit USDC, USDT or ETH from any wallet",
  "Lock a transparent FX rate before you send",
  "Birr delivered to CBE, Awash, Dashin or Telebirr",
];

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2 bg-white">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-slate-950 p-12 text-white lg:flex">
        {/* Animated background elements */}
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-[500px] w-[500px] rounded-full bg-indigo-600/20 blur-[120px] animate-pulse"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-20 h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[120px]"
          aria-hidden
        />

        <div className="relative">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-500/20">
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-white">
                <path
                  d="M12 2v20M7 6l5-4 5 4M7 18l5 4 5-4"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="text-xl font-bold tracking-tight">DiasporaPay</span>
          </Link>
        </div>

        <div className="relative max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold mb-6">
            <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
            Institutional Grade Security
          </div>
          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight">
            The bridge between <br />
            <span className="text-indigo-400">global liquidity</span> <br />
            and local impact.
          </h1>
          <p className="mt-6 text-lg text-slate-400 leading-relaxed">
            Send USDC to Ethiopia with real-time bank settlement and the best exchange rates in the market.
          </p>
          <ul className="mt-10 space-y-5">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-center gap-4 text-slate-300 font-medium">
                <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400">
                  <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
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
           <p className="text-xs text-slate-500 font-medium tracking-wide flex items-center gap-4">
            <span>SOC2 COMPLIANT</span>
            <span className="h-1 w-1 rounded-full bg-slate-700" />
            <span>FINCEN REGULATED</span>
          </p>
          <div className="flex gap-3 grayscale opacity-30">
             <span className="text-xl">🦊</span>
             <span className="text-xl">💳</span>
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
           <div className="lg:hidden mb-12 flex justify-center">
             <Link href="/" className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
                  <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
                    <path d="M12 2v20M7 6l5-4 5 4M7 18l5 4 5-4" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="text-xl font-bold tracking-tight text-slate-900">DiasporaPay</span>
              </Link>
           </div>
           {children}
        </div>
      </div>
    </div>
  );
}
