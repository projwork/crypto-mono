"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/AuthContext";

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, user, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login({ email, password });
      router.replace("/dashboard");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Unable to sign in. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Welcome back
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Sign in to manage your transfers and beneficiaries.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}

        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <Button type="submit" size="lg" className="w-full" loading={submitting}>
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-400"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
