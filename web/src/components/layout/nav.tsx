import type { ReactNode } from "react";
import type { Role } from "@/lib/api/types";

export interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
  /** If set, only show to these roles. */
  roles?: Role[];
}

const icon = (path: ReactNode) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5"
  >
    {path}
  </svg>
);

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: icon(
      <>
        <rect x="3" y="3" width="7" height="9" rx="1" />
        <rect x="14" y="3" width="7" height="5" rx="1" />
        <rect x="14" y="12" width="7" height="9" rx="1" />
        <rect x="3" y="16" width="7" height="5" rx="1" />
      </>,
    ),
  },
  {
    label: "Send Money",
    href: "/transfers/new",
    icon: icon(
      <>
        <path d="M22 2 11 13" />
        <path d="m22 2-7 20-4-9-9-4Z" />
      </>,
    ),
  },
  {
    label: "Transfers",
    href: "/transfers",
    icon: icon(
      <>
        <path d="M17 2v6h6" />
        <path d="M3 11V4a1 1 0 0 1 1-1h11l6 6v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-2" />
        <path d="M7 15h6" />
        <path d="m10 12-3 3 3 3" />
      </>,
    ),
  },
  {
    label: "Beneficiaries",
    href: "/beneficiaries",
    icon: icon(
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>,
    ),
  },
  {
    label: "Verification",
    href: "/kyc",
    icon: icon(
      <>
        <path d="M9 12l2 2 4-4" />
        <path d="M12 3a9 9 0 1 0 9 9" />
      </>,
    ),
  },
  {
    label: "Notifications",
    href: "/notifications",
    icon: icon(
      <>
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </>,
    ),
  },
  {
    label: "Admin",
    href: "/admin",
    roles: ["ADMIN"],
    icon: icon(
      <>
        <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
      </>,
    ),
  },
  {
    label: "Liquidity",
    href: "/admin/liquidity",
    roles: ["ADMIN"],
    icon: icon(
      <>
        <path d="M3 3v18h18" />
        <path d="m19 9-5 5-4-4-3 3" />
      </>,
    ),
  },
  {
    label: "KYC Review",
    href: "/admin/kyc",
    roles: ["ADMIN"],
    icon: icon(
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="m9 15 2 2 4-4" />
      </>,
    ),
  },
  {
    label: "Audit Log",
    href: "/admin/audit",
    roles: ["ADMIN"],
    icon: icon(
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M16 13H8M16 17H8M10 9H8" />
      </>,
    ),
  },
];
