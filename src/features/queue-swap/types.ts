export type SwapStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED';

export interface SwapRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  targetUserId: string;
  targetUserName: string;
  requesterSlot: number;
  targetSlot: number;
  status: SwapStatus;
  expiresAt: string;
  createdAt: string;
  queueId: string;
}

export interface IncomingSwap extends SwapRequest {
  type: 'incoming';
}

export interface OutgoingSwap extends SwapRequest {
  type: 'outgoing';
}

export interface SwapAction {
  id: string;
  action: 'confirm' | 'reject';
}
