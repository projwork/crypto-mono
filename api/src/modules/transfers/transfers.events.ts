import { EventEmitter } from "node:events";
import { TransferStatus } from "@prisma/client";

/** SSE event payload — documented in CONTRACTS.md. */
export interface TransferStatusEvent {
  transferId: string;
  reference: string;
  status: TransferStatus;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export const transferStatusBus = new EventEmitter();
transferStatusBus.setMaxListeners(100);

export const emitTransferStatus = (event: TransferStatusEvent): void => {
  transferStatusBus.emit(`transfer:${event.transferId}`, event);
  transferStatusBus.emit("transfer:*", event);
};
