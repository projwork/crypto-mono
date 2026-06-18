"use client";

export function Partners() {
  const partners = [
    { name: "MetaMask", icon: "🦊" },
    { name: "Swiss Liquidity", icon: "🇨🇭" },
    { name: "CBE", icon: "🏦" },
    { name: "Dashin Bank", icon: "💳" },
  ];

  return (
    <section className="border-y border-slate-100 bg-slate-50/50 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs font-bold uppercase tracking-widest text-slate-400 mb-8">
          Trusted By Institutional Partners
        </p>
        <div className="flex flex-wrap items-center justify-center gap-12 grayscale opacity-60">
          {partners.map((partner) => (
            <div key={partner.name} className="flex items-center gap-3">
               <span className="text-2xl">{partner.icon}</span>
               <span className="text-lg font-bold text-slate-900">{partner.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
