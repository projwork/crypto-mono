"use client";

const FEATURES = [
  {
    title: "Enterprise-Grade Security",
    description: "Your funds are protected through advanced multi-signature custody, secure infrastructure, and audited blockchain technology.",
  },
  {
    title: "Near-Instant Transfers",
    description: "Convert USDC to ETB and deliver funds to Ethiopian bank accounts and mobile wallets in as little as 15 minutes.",
  },
  {
    title: "Lower Costs",
    description: "Save up to 80% compared to traditional remittance and wire transfer services with our flat, transparent pricing.",
  },
  {
    title: "Complete Transparency",
    description: "Track every transaction on-chain from start to finish with real-time status updates and clear pricing.",
  },
];

export function Features() {
  return (
    <section id="security" className="py-20 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Why Choose LagerPay?</h2>
        </div>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="p-6 rounded-2xl ring-1 ring-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all">
              <h3 className="text-base font-bold text-slate-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}