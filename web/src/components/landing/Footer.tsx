"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-white border-t border-slate-100 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-5">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <div className="h-6 w-6 rounded bg-indigo-600 flex items-center justify-center">
                 <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-white">
                  <path d="M12 2v20M7 6l5-4 5 4M7 18l5 4 5-4" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900">DiasporaPay</span>
            </Link>
            <p className="max-w-xs text-sm text-slate-500 leading-relaxed">
              Secure Institutional Grade Remittance platform bridging the gap between digital assets and local currencies.
            </p>
            <div className="mt-6 flex gap-4 text-slate-400">
               <span className="hover:text-indigo-600 cursor-pointer">🌐</span>
               <span className="hover:text-indigo-600 cursor-pointer">✉️</span>
               <span className="hover:text-indigo-600 cursor-pointer">📱</span>
            </div>
          </div>
          
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900 mb-6">Company</h3>
            <ul className="space-y-4 text-sm text-slate-500">
               <li><button className="hover:text-indigo-600">About Us</button></li>
               <li><button className="hover:text-indigo-600">Careers</button></li>
               <li><button className="hover:text-indigo-600">Press</button></li>
               <li><button className="hover:text-indigo-600">Blog</button></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900 mb-6">Legal</h3>
            <ul className="space-y-4 text-sm text-slate-500">
               <li><button className="hover:text-indigo-600">Legal Policy</button></li>
               <li><button className="hover:text-indigo-600">Privacy</button></li>
               <li><button className="hover:text-indigo-600">Terms of Service</button></li>
               <li><button className="hover:text-indigo-600">Compliance</button></li>
            </ul>
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
          <p>© 2026 DiasporaPay. Secure Institutional Grade Remittance.</p>
          <div className="flex gap-4">
             <span>v2.4.0</span>
             <span>ETH-L2-Optimized</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
