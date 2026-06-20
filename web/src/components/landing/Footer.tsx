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
          <div className="text-xs text-slate-400 font-medium">
            © 2026 LagerPay. All Rights Reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}