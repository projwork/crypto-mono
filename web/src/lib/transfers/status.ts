import type { TransferStatus } from "@/lib/api/types";
import { humanize } from "@/lib/utils";

/** PRD §7 happy-path lifecycle (ordered). */
export const LIFECYCLE_STEPS: TransferStatus[] = [
  "INITIATED",
  "AWAITING_CRYPTO",
  "BLOCKCHAIN_PENDING",
  "BLOCKCHAIN_CONFIRMED",
  "SWISS_FUNDS_RECEIVED",
  "FX_CONVERTED",
  "PAYOUT_PROCESSING",
  "PAYOUT_SENT",
  "COMPLETED",
];

export const TERMINAL_FAILURE_STATUSES: TransferStatus[] = ["FAILED", "REVERSED", "EXPIRED"];

export function statusTone(
  status: TransferStatus,
): "success" | "warning" | "danger" | "info" | "neutral" {
  if (status === "COMPLETED") return "success";
  if (status === "FAILED" || status === "REVERSED") return "danger";
  if (status === "EXPIRED") return "neutral";
  if (status === "AWAITING_CRYPTO") return "warning";
  if (status === "INITIATED") return "neutral";
  return "info";
}

export function statusLabel(status: TransferStatus): string {
  return humanize(status);
}

/** Parse `TRANSFER_{STATUS}` audit actions into a status key. */
export function parseTimelineAction(action: string): TransferStatus | null {
  const match = /^TRANSFER_(.+)$/.exec(action);
  if (!match) return null;
  return match[1] as TransferStatus;
}

export type StepVisualState = "completed" | "current" | "pending" | "failed";

export function getStepState(
  step: TransferStatus,
  currentStatus: TransferStatus,
  reached: Map<TransferStatus, string>,
): StepVisualState {
  if (TERMINAL_FAILURE_STATUSES.includes(currentStatus)) {
    if (step === currentStatus) return "failed";
    const failedAt = reached.get(currentStatus);
    const stepTime = reached.get(step);
    if (stepTime && failedAt && stepTime <= failedAt) return "completed";
    const stepIdx = LIFECYCLE_STEPS.indexOf(step);
    const lastHappy = [...reached.keys()]
      .filter((s) => LIFECYCLE_STEPS.includes(s))
      .sort((a, b) => LIFECYCLE_STEPS.indexOf(a) - LIFECYCLE_STEPS.indexOf(b))
      .pop();
    if (lastHappy && stepIdx <= LIFECYCLE_STEPS.indexOf(lastHappy)) return "completed";
    return "pending";
  }

  if (currentStatus === "COMPLETED") {
    return LIFECYCLE_STEPS.includes(step) ? "completed" : "pending";
  }

  const stepIdx = LIFECYCLE_STEPS.indexOf(step);
  const currentIdx = LIFECYCLE_STEPS.indexOf(currentStatus);

  if (stepIdx === -1) return "pending";
  if (currentIdx === -1) {
    return reached.has(step) ? "completed" : "pending";
  }
  if (stepIdx < currentIdx) return "completed";
  if (stepIdx === currentIdx) return "current";
  return "pending";
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
