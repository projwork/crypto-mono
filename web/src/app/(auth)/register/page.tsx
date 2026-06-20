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
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Create Account
        </h2>
        <p className="mt-2 text-xs font-medium text-slate-500">
          Join LagerPay to start sending USDC to Ethiopia in minutes.
        </p>
      </div>

      <div className="bg-white p-7 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/40">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Alert tone="error">{error}</Alert>}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              placeholder="Abebe"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
              className="rounded-lg h-10 text-sm"
            />
            <Input
              label="Last Name"
              placeholder="Bekele"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
              className="rounded-lg h-10 text-sm"
            />
          </div>

          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            className="rounded-lg h-10 text-sm"
          />

          <Input
            label="Phone Number"
            type="tel"
            placeholder="+41 79 000 00 00"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
            className="rounded-lg h-10 text-sm"
          />

          <PasswordInput
            label="Password"
            placeholder="••••••••"
            autoComplete="new-password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            className="rounded-lg h-10 text-sm"
          />

          <p className="text-[10px] text-slate-500 leading-relaxed text-center px-4">
            By creating an account, you agree to our{" "}
            <Link href="/terms" className="text-indigo-600 font-bold">Terms of Service</Link> and{" "}
            <Link href="/privacy" className="text-indigo-600 font-bold">Privacy Policy</Link>.
          </p>

          <Button type="submit" size="lg" className="w-full bg-slate-950 text-white hover:bg-slate-800 rounded-lg h-11 font-bold mt-2 text-sm" loading={submitting}>
            Create Account
          </Button>
        </form>
      </div>

      <p className="mt-8 text-center text-xs font-medium text-slate-500">
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