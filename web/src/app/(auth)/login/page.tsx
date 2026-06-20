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
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Welcome Back
        </h2>
        <p className="mt-2 text-xs font-medium text-slate-500">
          Securely access your LagerPay account to manage remittances.
        </p>
      </div>

      <div className="bg-white p-7 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/40">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-xs py-2">
              <Alert tone="error">{error}</Alert>
            </div>
          )}

          <Input
            label="Email Address"
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded-lg h-10 text-sm"
          />
          <div className="space-y-1">
            <div className="flex items-center justify-between">
               <label className="text-xs font-bold text-slate-700">Password</label>
               <button type="button" className="text-[10px] font-bold text-indigo-600 hover:text-indigo-500 uppercase tracking-tight">
                 Forgot Password?
               </button>
            </div>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="rounded-lg h-10 text-sm"
            />
          </div>

          <Button type="submit" size="lg" className="w-full bg-slate-950 text-white hover:bg-slate-800 rounded-lg h-11 font-bold mt-2 text-sm" loading={submitting}>
            Sign In
          </Button>
        </form>
      </div>

      <p className="mt-8 text-center text-xs font-medium text-slate-500">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-bold text-indigo-600 hover:text-indigo-500"
        >
          Create account
        </Link>
      </p>
    </div>
  );
}