"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function Header() {
  return (
    <header className="fixed top-0 z-50 w-full border-b border-slate-200/50 bg-white/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center">
               <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-white">
                <path d="M12 2v20M7 6l5-4 5 4M7 18l5 4 5-4" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">LagerPay</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-xs font-semibold text-slate-600 hover:text-indigo-600 uppercase tracking-wide">Home</Link>
            <Link href="/#how-it-works" className="text-xs font-semibold text-slate-600 hover:text-indigo-600 uppercase tracking-wide">How It Works</Link>
            <Link href="/#security" className="text-xs font-semibold text-slate-600 hover:text-indigo-600 uppercase tracking-wide">Security</Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button size="sm" className="bg-slate-950 text-white hover:bg-slate-800 rounded-lg px-5 h-9 text-xs">
              Connect Wallet
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}