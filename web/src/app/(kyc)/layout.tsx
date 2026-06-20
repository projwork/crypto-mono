import type { ReactNode } from "react";
import { KycRouteGuard } from "@/components/auth/KycRouteGuard";

export default function KycWorkflowLayout({ children }: { children: ReactNode }) {
  return (
    <KycRouteGuard>
      
      <div className="w-full min-h-screen bg-[#030922]">
        {children}
      </div>
    </KycRouteGuard>
  );
}