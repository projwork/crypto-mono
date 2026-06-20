import type { ReactNode } from "react";
import { KycGuard } from "@/components/auth/KycGuard";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { AppShell } from "@/components/layout/AppShell";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <RouteGuard>
      <KycGuard>
        <AppShell>{children}</AppShell>
      </KycGuard>
    </RouteGuard>
  );
}
