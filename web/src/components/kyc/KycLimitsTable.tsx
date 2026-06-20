import type { TierInfo } from "@/lib/api/types";
import { formatUsd, humanize } from "@/lib/utils";

interface KycLimitsTableProps {
  tiers: TierInfo[];
  currentTier?: string;
}

export function KycLimitsTable({ tiers, currentTier }: KycLimitsTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100">
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-100">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
          Verification tiers & limits
        </h3>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
            <th className="px-4 py-3">Tier</th>
            <th className="px-4 py-3">Monthly limit</th>
            <th className="px-4 py-3 hidden sm:table-cell">Requirements</th>
          </tr>
        </thead>
        <tbody>
          {tiers.map((tier) => {
            const isCurrent = tier.tier === currentTier;
            return (
              <tr
                key={tier.tier}
                className={isCurrent ? "bg-indigo-50/60" : "border-b border-slate-50 last:border-0"}
              >
                <td className="px-4 py-3 font-semibold text-slate-900">
                  {humanize(tier.tier.replace("TIER_", "Tier "))}
                  {isCurrent && (
                    <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                      Selected
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-indigo-600 font-medium">
                  {tier.monthlyLimitUsd === null
                    ? "Unlimited"
                    : formatUsd(tier.monthlyLimitUsd)}
                </td>
                <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">
                  {tier.requirements.join(" · ")}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
