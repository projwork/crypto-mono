"use client";

import { Button } from "@/components/ui/Button";
import Link from "next/link";

export function CTA() {
  return (
    <section className="bg-slate-950 py-20 relative overflow-hidden">
      <div className="relative mx-auto max-w-4xl px-4 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-white sm:text-4xl">
          Empowering the Ethiopian Diaspora
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-300">
          Whether you're supporting family, paying suppliers, or investing back home, LagerPay makes every transfer faster, more affordable, and more transparent.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/register">
            <Button size="lg" className="bg-indigo-600 text-white hover:bg-indigo-500 rounded-lg px-8 h-12 text-sm w-full sm:w-auto">
              Get Started Now
            </Button>
          </Link>
          {/* Fixed: Converted non-functional button to Link */}
          <Link
            href="/rates"
            className="w-full sm:w-auto inline-flex items-center justify-center text-xs font-bold uppercase tracking-widest text-white border border-white/20 px-8 h-12 rounded-lg hover:bg-white/5"
          >
            View Live Rates
          </Link>
        </div>
      </div>
    </section>
  );
}
