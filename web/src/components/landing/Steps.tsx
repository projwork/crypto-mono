"use client";

const STEPS = [
  {
    number: "01",
    title: "Connect Your Wallet",
    description: "Use MetaMask, Coinbase Wallet, or WalletConnect to securely access your digital assets.",
  },
  {
    number: "02",
    title: "Enter the Amount",
    description: "Get live exchange rates and instant ETB conversion before sending your USDC.",
  },
  {
    number: "03",
    title: "Select a Recipient",
    description: "Send directly to supported Ethiopian bank accounts or mobile money wallets.",
  },
  {
    number: "04",
    title: "Track in Real Time",
    description: "Monitor your transfer every step of the way on the blockchain until funds are received.",
  },
];

export function Steps() {
  return (
    <section id="how-it-works" className="py-20 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl mb-12 text-center">
          How It Works
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <div key={step.number} className="relative p-6 bg-white rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-indigo-600 mb-2 block">{step.number}</span>
              <h3 className="text-sm font-bold text-slate-900 mb-2">{step.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}