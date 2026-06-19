"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { ApiError } from "@/lib/api/client";
import { authApi } from "@/lib/api/auth";
import { getPostAuthRoute } from "@/lib/auth/routing";
import { useAuth } from "@/lib/auth/AuthContext";

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      void getPostAuthRoute(user).then((route) => router.replace(route));
    }
  }, [loading, user, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login({ email, password });
      const me = await authApi.me();
      const route = await getPostAuthRoute(me);
      router.replace(route);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Unable to sign in. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
          Welcome back
        </h2>
        <p className="mt-3 text-slate-500 font-medium">
          Securely access your DiasporaPay account.
        </p>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <Alert tone="error">{error}</Alert>}

          <Input
            label="Email address"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded-xl h-12"
          />

          <PasswordInput
            label="Password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="rounded-xl h-12"
            labelAction={
              <button type="button" className="text-xs font-bold text-indigo-600 hover:text-indigo-500">
                Forgot?
              </button>
            }
          />

          <Button type="submit" size="lg" className="w-full bg-slate-950 text-white hover:bg-slate-800 rounded-xl h-12 font-bold mt-2" loading={submitting}>
            Sign In
          </Button>
        </form>

        <div className="relative mt-8">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-slate-100" />
          </div>
          <div className="relative flex justify-center text-xs font-bold uppercase tracking-widest">
            <span className="bg-white px-4 text-slate-400">or continue with</span>
          </div>
        </div>

        <div className="mt-8">
          <Link href="/metamask" className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 h-12 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">
             <span className="text-lg">🦊</span>
             Connect MetaMask
          </Link>
        </div>
      </div>

      <p className="mt-8 text-center text-sm font-medium text-slate-500">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-bold text-indigo-600 hover:text-indigo-500"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
