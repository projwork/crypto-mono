import { api } from "./client";

export interface LiquidityPoolsSnapshot {
  pools: {
    swiss: {
      type: string;
      name: string;
      chfBalance: number;
      usdBalance: number;
      incomingDeposits: number;
      pendingSettlements: number;
    };
    ethiopia: {
      type: string;
      name: string;
      etbAvailable: number;
      etbReserved: number;
      etbDisbursed: number;
      etbCapacity: number;
    };
  };
  alerts: {
    lowLiquidityWarning: boolean;
    reasons: string[];
  };
}

export interface LiquidityLedgerEntry {
  id: string;
  date: string;
  poolType: string;
  poolName: string;
  type: string;
  currency: string;
  amount: number;
  balance: number;
  referenceId: string | null;
  note: string | null;
}

export const liquidityApi = {
  async getPools(): Promise<LiquidityPoolsSnapshot> {
    return api.get<LiquidityPoolsSnapshot>("/api/liquidity/pools");
  },

  async getLedger(limit = 100): Promise<LiquidityLedgerEntry[]> {
    const { ledger } = await api.get<{ ledger: LiquidityLedgerEntry[] }>(
      `/api/liquidity/ledger?limit=${limit}`,
    );
    return ledger;
  },
};
