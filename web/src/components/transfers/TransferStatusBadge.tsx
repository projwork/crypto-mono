import { Badge } from "@/components/ui/Badge";
import type { TransferStatus } from "@/lib/api/types";
import { statusLabel, statusTone } from "@/lib/transfers/status";

export function TransferStatusBadge({ status }: { status: TransferStatus }) {
  return <Badge tone={statusTone(status)}>{statusLabel(status)}</Badge>;
}
