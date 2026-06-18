"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useAuth } from "@/lib/auth/AuthContext";
import { humanize } from "@/lib/utils";

function kycTone(status: string): "success" | "warning" | "danger" {
  if (status === "APPROVED") return "success";
  if (status === "REJECTED") return "danger";
  return "warning";
}

const QUICK_ACTIONS = [
  {
    title: "Send money",
    description: "Start a new crypto-to-Birr transfer.",
    href: "/transfers/new",
  },
  {
    title: "Add a beneficiary",
    description: "Save a recipient for faster transfers.",
    href: "/beneficiaries",
  },
  {
    title: "Complete verification",
    description: "Raise your limits with KYC.",
    href: "/kyc",
  },
];

export default function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-indigo-600 to-teal-700 text-white">
        <CardContent className="flex flex-col gap-4 p-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-indigo-100">Good to see you,</p>
            <h1 className="mt-1 text-2xl font-semibold">
              {user.firstName} {user.lastName}
            </h1>
            <p className="mt-2 max-w-md text-sm text-indigo-50/90">
              Send crypto and deliver Ethiopian Birr to family and friends in just a few steps.
            </p>
          </div>
          <Link href="/transfers/new">
            <Button variant="secondary" size="lg" className="bg-white text-indigo-700 hover:bg-indigo-50">
              Send money
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Account status */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Verification</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <Badge tone={kycTone(user.kycStatus)}>{humanize(user.kycStatus)}</Badge>
            <span className="text-sm text-slate-500">{humanize(user.kycTier)}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 dark:text-slate-300">{user.email}</p>
            <p className="mt-1 text-xs text-slate-400">{user.country}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Role</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge tone="info">{humanize(user.role)}</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
          Quick actions
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {QUICK_ACTIONS.map((action) => (
            <Link key={action.href} href={action.href}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="p-5">
                  <p className="font-medium text-slate-900 dark:text-slate-100">{action.title}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {action.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Empty state for transfers (real data wired in a later module) */}
      <Card>
        <CardHeader>
          <CardTitle>Recent transfers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-6 w-6">
                <path d="M22 2 11 13" strokeLinecap="round" strokeLinejoin="round" />
                <path d="m22 2-7 20-4-9-9-4Z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                No transfers yet
              </p>
              <p className="text-sm text-slate-400">Your transfers will appear here once you send.</p>
            </div>
            <Link href="/transfers/new">
              <Button size="sm">Start a transfer</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
