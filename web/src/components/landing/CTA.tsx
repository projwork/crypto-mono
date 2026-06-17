"use client";

import { Button } from "@/components/ui/Button";
import Link from "next/link";

export function CTA() {
  return (
    <section className="bg-slate-950 py-24 sm:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-tr from-indigo-950 to-slate-950 opacity-50" />
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
      
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
          Join the Future of Global Remittances
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-slate-300">
          Secure, instant, and affordable. Start sending USDC to your loved ones in Ethiopia today.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link href="/register">
            <Button size="lg" className="bg-indigo-600 text-white hover:bg-indigo-500 rounded-xl px-8 h-14">
              Get Started Now
            </Button>
          </Link>
          <button className="text-sm font-semibold leading-6 text-white border border-white/20 px-8 h-14 rounded-xl hover:bg-white/5">
            Contact Sales
          </button>
        </div>
      </div>
    </section>
  );
}
