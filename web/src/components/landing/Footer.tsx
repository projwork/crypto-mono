"use client";

export function Footer() {
  return (
    <footer className="bg-white border-t border-slate-100 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <span className="text-lg font-bold tracking-tight text-slate-900">LagerPay</span>
            <p className="mt-2 text-xs text-slate-500 max-w-xs">
              Transforming the future of remittances by connecting global digital assets with local financial access.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900 mb-6">Support</h3>
            <ul className="space-y-4 text-sm text-slate-500">
               <li><button className="hover:text-indigo-600">Help Center</button></li>
               <li><button className="hover:text-indigo-600">Contact Us</button></li>
               <li><button className="hover:text-indigo-600">Security Policy</button></li>
               <li><button className="hover:text-indigo-600">API Documentation</button></li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-slate-100 flex flex-col items-center gap-4 text-xs text-slate-400 sm:flex-row sm:justify-between">
          <p>© 2026 LagerPay. Secure Institutional Grade Remittance.</p>
          <div className="flex gap-4">
             <span>v2.4.0</span>
             <span>ETH-L2-Optimized</span>
          </div>
        </div>
      </div>
    </footer>
  );
}