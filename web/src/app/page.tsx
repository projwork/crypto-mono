"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { getPostAuthRoute } from "@/lib/auth/routing";
import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { Partners } from "@/components/landing/Partners";
import { Features } from "@/components/landing/Features";
import { Steps } from "@/components/landing/Steps";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      void getPostAuthRoute(user).then((route) => router.replace(route));
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  // To prevent flash of landing page for authenticated users
  if (user) return null;

  return (
    <main className="min-h-screen bg-white selection:bg-indigo-100 selection:text-indigo-900 font-sans antialiased">
      <Header />
      <Hero />
      <Partners />
      <Features />
      <Steps />
      <CTA />
      <Footer />
    </main>
  );
}
