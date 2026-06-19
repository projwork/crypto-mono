"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { ApiError } from "@/lib/api/client";
import { getPostAuthRoute } from "@/lib/auth/routing";
import { useAuth } from "@/lib/auth/AuthContext";

export default function RegisterPage() {
  const { register, user, loading } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    country: "Switzerland",
    password: "",
    confirmPassword: "",
  });
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

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match. Please re-enter your password.");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const { confirmPassword: _, ...payload } = formData;
      await register(payload);
      router.replace("/kyc/submit");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Unable to create account. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
          Create account
        </h2>
        <p className="mt-3 text-slate-500 font-medium">
          Join DiasporaPay to start sending USDC today.
        </p>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Alert tone="error">{error}</Alert>}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First name"
              placeholder="Abebe"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
              className="rounded-xl h-11"
            />
            <Input
              label="Last name"
              placeholder="Bekele"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
              className="rounded-xl h-11"
            />
          </div>

          <Input
            label="Email address"
            type="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            className="rounded-xl h-11"
          />

          <Input
            label="Phone number"
            type="tel"
            placeholder="+41 79 123 45 67"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
            className="rounded-xl h-11"
          />

          <PasswordInput
            label="Password"
            placeholder="••••••••"
            autoComplete="new-password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            minLength={8}
            className="rounded-xl h-11"
            hint="At least 8 characters"
          />

          <PasswordInput
            label="Confirm password"
            placeholder="••••••••"
            autoComplete="new-password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            required
            className="rounded-xl h-11"
          />

          <p className="text-[11px] text-slate-500 leading-relaxed text-center px-2">
            By creating an account, you agree to our{" "}
            <Link href="/terms" className="text-indigo-600 font-bold">Terms</Link> and{" "}
            <Link href="/privacy" className="text-indigo-600 font-bold">Privacy</Link>.
          </p>

          <Button type="submit" size="lg" className="w-full bg-slate-950 text-white hover:bg-slate-800 rounded-xl h-12 font-bold mt-2" loading={submitting}>
            Create Account
          </Button>
        </form>

        <div className="relative mt-6">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-slate-100" />
          </div>
          <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest">
            <span className="bg-white px-4 text-slate-400">or join with</span>
          </div>
        </div>

        <div className="mt-6">
          <Link href="/metamask" className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 h-12 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">
            <span className="text-lg">🦊</span>
            Connect MetaMask
          </Link>
        </div>
      </div>

      <p className="mt-8 text-center text-sm font-medium text-slate-500">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-bold text-indigo-600 hover:text-indigo-500"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
