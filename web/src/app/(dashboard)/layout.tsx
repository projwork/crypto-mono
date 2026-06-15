import type { ReactNode } from "react";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { AppShell } from "@/components/layout/AppShell";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <RouteGuard>
      <AppShell>{children}</AppShell>
    </RouteGuard>
  );
}
