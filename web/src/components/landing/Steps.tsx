"use client";

import Image from "next/image";

const STEPS = [
  {
    number: "1",
    title: "Connect Wallet",
    description: "Link your MetaMask, Coinbase, or any WalletConnect compatible wallet securely.",
  },
  {
    number: "2",
    title: "Enter Amount",
    description: "Specify how much USDC you want to send, and we'll show you the exact ETB conversion instantly.",
  },
  {
    number: "3",
    title: "Choose Recipient",
    description: "Select a bank account or mobile wallet in Ethiopia, we support all major financial institutions.",
  },
  {
    number: "4",
    title: "Track in Real-time",
    description: "Watch your transaction move from crypto to local currency on our live dashboard.",
  },
];

export function Steps() {
  return (
    <section id="how-it-works" className="py-24 sm:py-32 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mb-12">
              Simple. Fast. Transparent.
            </h2>
            <div className="space-y-10">
              {STEPS.map((step) => (
                <div key={step.number} className="flex gap-6">
                  <div className="flex-none flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white text-sm font-bold">
                    {step.number}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">{step.title}</h3>
                    <p className="text-slate-600 leading-relaxed text-sm">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex justify-center">
             <div className="absolute -inset-10 bg-indigo-500/10 blur-3xl rounded-full" />
             <div className="relative w-full max-w-[400px]">
                <Image 
                  src="/images/phone-mockup.png" 
                  alt="DiasporaPay App Mockup" 
                  width={800} 
                  height={1600} 
                  className="w-full h-auto drop-shadow-2xl"
                />
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}
